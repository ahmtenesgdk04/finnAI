import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, Alert, Image, ActivityIndicator,
  ScrollView, Dimensions, StatusBar, Animated, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { colors } from '../../constants/colors';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STORAGE_KEY = 'vault_metadata';
const VAULT_DIR = (FileSystem.documentDirectory ?? '') + 'vault/';

type FolderItem = {
  id: string;
  name: string;
  itemType: 'folder';
  parentId: string | null;
  createdAt: string;
};

type FileItem = {
  id: string;
  name: string;
  itemType: 'file';
  parentId: string | null;
  mimeType: string;
  localUri: string;
  size: number;
  extension: string;
  createdAt: string;
};

type VaultItem = FolderItem | FileItem;

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ZoomableImage({ uri }: { uri: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const txAnim = useRef(new Animated.Value(0)).current;
  const tyAnim = useRef(new Animated.Value(0)).current;

  const currentScale = useRef(1);
  const currentTx = useRef(0);
  const currentTy = useRef(0);

  const pinchInitDist = useRef(0);
  const pinchInitScale = useRef(1);
  const pinchInitTx = useRef(0);
  const pinchInitTy = useRef(0);
  const pinchMidX = useRef(0);
  const pinchMidY = useRef(0);

  const panLastX = useRef(0);
  const panLastY = useRef(0);

  const CX = SCREEN_W / 2;
  const CY = SCREEN_H / 2;

  const getDist = (t: any[]) => {
    const dx = t[0].pageX - t[1].pageX;
    const dy = t[0].pageY - t[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const t = evt.nativeEvent.touches;
        if (t.length >= 2) {
          pinchInitDist.current = getDist(t);
          pinchInitScale.current = currentScale.current;
          pinchInitTx.current = currentTx.current;
          pinchInitTy.current = currentTy.current;
          pinchMidX.current = (t[0].pageX + t[1].pageX) / 2;
          pinchMidY.current = (t[0].pageY + t[1].pageY) / 2;
        } else {
          panLastX.current = t[0].pageX;
          panLastY.current = t[0].pageY;
        }
      },
      onPanResponderMove: (evt) => {
        const t = evt.nativeEvent.touches;
        if (t.length >= 2) {
          if (pinchInitDist.current === 0) {
            pinchInitDist.current = getDist(t);
            pinchInitScale.current = currentScale.current;
            pinchInitTx.current = currentTx.current;
            pinchInitTy.current = currentTy.current;
            pinchMidX.current = (t[0].pageX + t[1].pageX) / 2;
            pinchMidY.current = (t[0].pageY + t[1].pageY) / 2;
            return;
          }
          const s0 = pinchInitScale.current;
          const s1 = Math.max(1, Math.min(6, s0 * (getDist(t) / pinchInitDist.current)));
          const ratio = s1 / s0;
          const mx = pinchMidX.current;
          const my = pinchMidY.current;
          // zoom towards pinch midpoint: keep mid pixel fixed on screen
          const newTx = (mx - CX) - ratio * (mx - CX - pinchInitTx.current);
          const newTy = (my - CY) - ratio * (my - CY - pinchInitTy.current);
          currentScale.current = s1;
          currentTx.current = newTx;
          currentTy.current = newTy;
          scaleAnim.setValue(s1);
          txAnim.setValue(newTx);
          tyAnim.setValue(newTy);
        } else if (t.length === 1 && currentScale.current > 1) {
          const dx = t[0].pageX - panLastX.current;
          const dy = t[0].pageY - panLastY.current;
          panLastX.current = t[0].pageX;
          panLastY.current = t[0].pageY;
          const newTx = currentTx.current + dx;
          const newTy = currentTy.current + dy;
          currentTx.current = newTx;
          currentTy.current = newTy;
          txAnim.setValue(newTx);
          tyAnim.setValue(newTy);
        }
      },
      onPanResponderRelease: () => {
        pinchInitDist.current = 0;
        if (currentScale.current <= 1) {
          Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
            Animated.spring(txAnim, { toValue: 0, useNativeDriver: true }),
            Animated.spring(tyAnim, { toValue: 0, useNativeDriver: true }),
          ]).start();
          currentScale.current = 1;
          currentTx.current = 0;
          currentTy.current = 0;
        }
      },
      onPanResponderTerminate: () => { pinchInitDist.current = 0; },
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  return (
    <Animated.Image
      {...panResponder.panHandlers}
      source={{ uri }}
      style={{
        width: SCREEN_W,
        height: SCREEN_H,
        transform: [{ translateX: txAnim }, { translateY: tyAnim }, { scale: scaleAnim }],
      }}
      resizeMode="contain"
    />
  );
}

type IconConfig = { icon: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string };

function getFileIconConfig(extension: string, mimeType = ''): IconConfig {
  const ext = extension.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext) || mimeType.startsWith('image/'))
    return { icon: 'image', color: '#7C3AED', bg: '#F5F3FF' };
  if (ext === 'pdf') return { icon: 'document-text', color: '#EF4444', bg: '#FEF2F2' };
  if (['doc', 'docx'].includes(ext)) return { icon: 'document', color: '#1B4FD8', bg: '#EFF6FF' };
  if (['xls', 'xlsx', 'csv'].includes(ext)) return { icon: 'grid', color: '#16A34A', bg: '#F0FDF4' };
  if (['ppt', 'pptx'].includes(ext)) return { icon: 'easel', color: '#EA580C', bg: '#FFF7ED' };
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext) || mimeType.startsWith('video/'))
    return { icon: 'videocam', color: '#0891B2', bg: '#F0FDFA' };
  return { icon: 'document-outline', color: colors.text.secondary, bg: colors.background };
}

export default function DocumentVaultScreen({ navigation }: { navigation: any }) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([]);

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [detailItem, setDetailItem] = useState<VaultItem | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTarget, setRenameTarget] = useState<VaultItem | null>(null);
  const [renameName, setRenameName] = useState('');
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;

  const currentItems = useMemo(() => {
    return items
      .filter(i => i.parentId === currentFolderId)
      .sort((a, b) => {
        if (a.itemType === 'folder' && b.itemType !== 'folder') return -1;
        if (a.itemType !== 'folder' && b.itemType === 'folder') return 1;
        return a.name.localeCompare(b.name, 'tr');
      });
  }, [items, currentFolderId]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      await FileSystem.makeDirectoryAsync(VAULT_DIR, { intermediates: true });
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  };

  const persist = async (updated: VaultItem[]) => {
    setItems(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const createFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const folder: FolderItem = {
      id: Date.now().toString(),
      name,
      itemType: 'folder',
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
    };
    await persist([...items, folder]);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const pickDocument = async () => {
    setShowAddMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const ext = getExtension(asset.name);
      const id = Date.now().toString();
      const destUri = VAULT_DIR + id + (ext ? '.' + ext : '');
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });
      const info = await FileSystem.getInfoAsync(destUri);
      await persist([...items, {
        id, name: asset.name, itemType: 'file', parentId: currentFolderId,
        mimeType: asset.mimeType ?? '', localUri: destUri,
        size: info.exists && 'size' in info ? (info.size as number) : 0,
        extension: ext, createdAt: new Date().toISOString(),
      } as FileItem]);
    } catch {
      Alert.alert('Hata', 'Dosya eklenirken bir sorun oluştu.');
    }
  };

  const pickImage = async (useCamera: boolean) => {
    setShowAddMenu(false);
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('İzin gerekli', 'Kamera izni verilmedi.'); return; }
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 1.0 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'livePhotos', 'videos'], quality: 1.0 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const ext = getExtension(asset.uri.split('/').pop() ?? 'jpg') || 'jpg';
      const id = Date.now().toString();
      const destUri = VAULT_DIR + id + '.' + ext;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });
      const info = await FileSystem.getInfoAsync(destUri);
      await persist([...items, {
        id,
        name: useCamera
          ? `Fotoğraf_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.${ext}`
          : (asset.fileName ?? `Medya_${id}.${ext}`),
        itemType: 'file', parentId: currentFolderId,
        mimeType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
        localUri: destUri,
        size: info.exists && 'size' in info ? (info.size as number) : 0,
        extension: ext, createdAt: new Date().toISOString(),
      } as FileItem]);
    } catch {
      Alert.alert('Hata', 'Medya eklenirken bir sorun oluştu.');
    }
  };

  const collectDescendantIds = (folderId: string): string[] => {
    const result: string[] = [];
    const traverse = (id: string) => {
      items.filter(i => i.parentId === id).forEach(child => {
        result.push(child.id);
        if (child.itemType === 'folder') traverse(child.id);
        else FileSystem.deleteAsync((child as FileItem).localUri, { idempotent: true }).catch(() => {});
      });
    };
    traverse(folderId);
    return result;
  };

  const deleteItem = (item: VaultItem) => {
    Alert.alert(
      item.itemType === 'folder' ? 'Klasörü Sil' : 'Dosyayı Sil',
      item.itemType === 'folder'
        ? `"${item.name}" ve içindeki tüm öğeler silinecek. Emin misiniz?`
        : `"${item.name}" silinecek. Emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            setDetailItem(null);
            const toDelete = [item.id];
            if (item.itemType === 'folder') toDelete.push(...collectDescendantIds(item.id));
            else await FileSystem.deleteAsync((item as FileItem).localUri, { idempotent: true }).catch(() => {});
            await persist(items.filter(i => !toDelete.includes(i.id)));
          },
        },
      ]
    );
  };

  const renameItem = async () => {
    if (!renameTarget || !renameName.trim()) return;
    await persist(items.map(i => i.id === renameTarget.id ? { ...i, name: renameName.trim() } : i));
    setShowRenameModal(false);
    setRenameTarget(null);
  };

  const saveToGallery = async (uri: string) => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') { Alert.alert('İzin gerekli', 'Galeri erişim izni verilmedi.'); return; }
    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Kaydedildi', 'Dosya galeriye kaydedildi.');
    } catch { Alert.alert('Hata', 'Galeriye kaydedilirken sorun oluştu.'); }
  };

  const shareFile = async (uri: string) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Desteklenmiyor', 'Bu cihazda paylaşım özelliği kullanılamıyor.'); return;
      }
      await Sharing.shareAsync(uri);
    } catch { Alert.alert('Hata', 'Paylaşılırken sorun oluştu.'); }
  };

  const openRename = (item: VaultItem) => {
    setDetailItem(null);
    setRenameTarget(item);
    setRenameName(item.name);
    setShowRenameModal(true);
  };

  const navigateInto = (folder: FolderItem) =>
    setFolderStack(prev => [...prev, { id: folder.id, name: folder.name }]);

  const navigateBack = () => {
    if (folderStack.length > 0) setFolderStack(prev => prev.slice(0, -1));
    else navigation.goBack();
  };

  const folderChildCount = (id: string) => items.filter(i => i.parentId === id).length;

  const isImageFile = (item: VaultItem) => {
    if (item.itemType !== 'file') return false;
    const f = item as FileItem;
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(f.extension) || f.mimeType.startsWith('image/');
  };

  const renderItem = ({ item, index }: { item: VaultItem; index: number }) => {
    const isFolder = item.itemType === 'folder';
    const fileItem = item as FileItem;
    const cfg = isFolder ? null : getFileIconConfig(fileItem.extension, fileItem.mimeType);
    const showThumb = !isFolder && isImageFile(item);

    return (
      <TouchableOpacity
        style={[styles.row, index === 0 && styles.rowFirst]}
        onPress={() => isFolder ? navigateInto(item as FolderItem) : setDetailItem(item)}
        onLongPress={() => setDetailItem(item)}
        activeOpacity={0.7}
      >
        {/* Icon / Thumbnail */}
        {showThumb ? (
          <Image source={{ uri: fileItem.localUri }} style={styles.rowThumb} resizeMode="cover" />
        ) : (
          <View style={[styles.rowIconWrap, { backgroundColor: isFolder ? '#EFF6FF' : cfg!.bg }]}>
            {isFolder
              ? <Ionicons name="folder" size={22} color={colors.business} />
              : <Ionicons name={cfg!.icon} size={22} color={cfg!.color} />
            }
          </View>
        )}

        {/* Info */}
        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rowSub}>
            {isFolder
              ? `${folderChildCount(item.id)} öğe`
              : `${fileItem.extension.toUpperCase() || 'DOSYA'} · ${formatSize(fileItem.size)}`
            }
            {' · '}{formatDate(item.createdAt)}
          </Text>
        </View>

        {/* Right */}
        <View style={styles.rowRight}>
          {isFolder
            ? <Ionicons name="chevron-forward" size={17} color={colors.text.muted} />
            : <TouchableOpacity onPress={() => setDetailItem(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={18} color={colors.text.muted} />
              </TouchableOpacity>
          }
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyComponent = (
    <View style={styles.empty}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="folder-open-outline" size={44} color={colors.text.muted} />
      </View>
      <Text style={styles.emptyTitle}>Bu klasör boş</Text>
      <Text style={styles.emptySub}>Sağ alttaki + ile klasör veya dosya ekleyin</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={navigateBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {folderStack.length > 0 ? folderStack[folderStack.length - 1].name : 'Belgelerim'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Breadcrumb — wrapped in View with fixed height to prevent Android expansion */}
      {folderStack.length > 0 && (
        <View style={styles.breadcrumbOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.breadcrumbInner}
          >
            <TouchableOpacity
              onPress={() => setFolderStack([])}
              style={styles.breadcrumbHomeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="home-outline" size={16} color={colors.business} />
            </TouchableOpacity>
            {folderStack.map((f, i) => (
              <React.Fragment key={f.id}>
                <Ionicons name="chevron-forward" size={13} color={colors.text.muted} />
                <TouchableOpacity
                  onPress={() => setFolderStack(prev => prev.slice(0, i + 1))}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                >
                  <Text style={[styles.crumb, i === folderStack.length - 1 && styles.crumbActive]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content — flex: 1 wrapper guarantees remaining space */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.business} size="large" />
        ) : (
          <FlatList
            data={currentItems}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={EmptyComponent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddMenu(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Add Menu ── */}
      <Modal visible={showAddMenu} transparent animationType="fade" onRequestClose={() => setShowAddMenu(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddMenu(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.addSheet}>
              <View style={styles.handle} />
              <Text style={styles.addSheetTitle}>Ekle</Text>
              {([
                { icon: 'folder-open-outline', label: 'Yeni Klasör',    color: colors.business, bg: '#EFF6FF', action: () => { setShowAddMenu(false); setShowNewFolderModal(true); } },
                { icon: 'document-attach-outline', label: 'Dosya Seç', color: '#7C3AED',        bg: '#F5F3FF', action: pickDocument },
                { icon: 'camera-outline',          label: 'Fotoğraf Çek', color: '#D97706',     bg: '#FEF3C7', action: () => pickImage(true) },
                { icon: 'images-outline',          label: 'Galeriden Seç', color: '#16A34A',    bg: '#F0FDF4', action: () => pickImage(false) },
              ] as { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; color: string; bg: string; action: () => void }[]).map(opt => (
                <TouchableOpacity key={opt.label} style={styles.addOption} onPress={opt.action}>
                  <View style={[styles.addOptionIcon, { backgroundColor: opt.bg }]}>
                    <Ionicons name={opt.icon} size={22} color={opt.color} />
                  </View>
                  <Text style={styles.addOptionLabel}>{opt.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.text.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── New Folder Dialog ── */}
      <Modal visible={showNewFolderModal} transparent animationType="fade" onRequestClose={() => setShowNewFolderModal(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Yeni Klasör</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="Klasör adı"
              placeholderTextColor={colors.text.muted}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
              onSubmitEditing={createFolder}
            />
            <View style={styles.dialogBtns}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => { setShowNewFolderModal(false); setNewFolderName(''); }}>
                <Text style={styles.dialogCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogOkBtn} onPress={createFolder}>
                <Text style={styles.dialogOkText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Detail / Action Sheet ── */}
      <Modal visible={!!detailItem} transparent animationType="slide" onRequestClose={() => setDetailItem(null)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setDetailItem(null)} />
          {detailItem && (
            <View style={styles.detailSheet}>
              <View style={styles.handle} />

              {/* Image preview */}
              {isImageFile(detailItem) && (
                <Image
                  source={{ uri: (detailItem as FileItem).localUri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              )}

              {/* Info row */}
              <View style={styles.detailHeader}>
                <View style={[styles.detailIconWrap, {
                  backgroundColor: detailItem.itemType === 'folder' ? '#EFF6FF'
                    : getFileIconConfig((detailItem as FileItem).extension, (detailItem as FileItem).mimeType).bg,
                }]}>
                  {detailItem.itemType === 'folder'
                    ? <Ionicons name="folder" size={28} color={colors.business} />
                    : <Ionicons
                        name={getFileIconConfig((detailItem as FileItem).extension, (detailItem as FileItem).mimeType).icon}
                        size={28}
                        color={getFileIconConfig((detailItem as FileItem).extension, (detailItem as FileItem).mimeType).color}
                      />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailName} numberOfLines={2}>{detailItem.name}</Text>
                  <Text style={styles.detailMeta}>
                    {detailItem.itemType === 'folder'
                      ? `Klasör · ${folderChildCount(detailItem.id)} öğe`
                      : `${(detailItem as FileItem).extension.toUpperCase()} · ${formatSize((detailItem as FileItem).size)}`
                    }
                    {' · '}{formatDate(detailItem.createdAt)}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.detailActions}>
                {isImageFile(detailItem) && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EFF6FF' }]}
                    onPress={() => { setDetailItem(null); setViewerUri((detailItem as FileItem).localUri); }}>
                    <Ionicons name="expand-outline" size={19} color={colors.business} />
                    <Text style={[styles.actionBtnText, { color: colors.business }]}>Tam Ekranda Gör</Text>
                  </TouchableOpacity>
                )}
                {isImageFile(detailItem) && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F0FDF4' }]}
                    onPress={() => saveToGallery((detailItem as FileItem).localUri)}>
                    <Ionicons name="download-outline" size={19} color="#16A34A" />
                    <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Galeriye Kaydet</Text>
                  </TouchableOpacity>
                )}
                {detailItem.itemType === 'file' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#F5F3FF' }]}
                    onPress={() => shareFile((detailItem as FileItem).localUri)}>
                    <Ionicons name="share-outline" size={19} color="#7C3AED" />
                    <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>Paylaş / Aç</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF3C7' }]}
                  onPress={() => openRename(detailItem)}>
                  <Ionicons name="pencil-outline" size={19} color="#D97706" />
                  <Text style={[styles.actionBtnText, { color: '#D97706' }]}>Yeniden Adlandır</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#FEF2F2' }]}
                  onPress={() => deleteItem(detailItem)}>
                  <Ionicons name="trash-outline" size={19} color={colors.danger} />
                  <Text style={[styles.actionBtnText, { color: colors.danger }]}>Sil</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ── Full-Screen Image Viewer ── */}
      <Modal visible={!!viewerUri} transparent={false} animationType="fade" onRequestClose={() => setViewerUri(null)}>
        <View style={styles.viewerContainer}>
          <StatusBar hidden />
          <View style={styles.viewerImageArea}>
            <ZoomableImage uri={viewerUri ?? ''} />
          </View>
          <TouchableOpacity style={styles.viewerCloseBtn} onPress={() => setViewerUri(null)}>
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          <View style={styles.viewerBottomBar}>
            <TouchableOpacity style={styles.viewerBottomBtn} onPress={() => viewerUri && saveToGallery(viewerUri)}>
              <Ionicons name="download-outline" size={22} color="#fff" />
              <Text style={styles.viewerBottomText}>Galeriye Kaydet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewerBottomBtn} onPress={() => viewerUri && shareFile(viewerUri)}>
              <Ionicons name="share-outline" size={22} color="#fff" />
              <Text style={styles.viewerBottomText}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Rename Dialog ── */}
      <Modal visible={showRenameModal} transparent animationType="fade" onRequestClose={() => setShowRenameModal(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Yeniden Adlandır</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="Yeni ad"
              placeholderTextColor={colors.text.muted}
              value={renameName}
              onChangeText={setRenameName}
              autoFocus
              onSubmitEditing={renameItem}
            />
            <View style={styles.dialogBtns}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setShowRenameModal(false)}>
                <Text style={styles.dialogCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogOkBtn} onPress={renameItem}>
                <Text style={styles.dialogOkText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary, flex: 1, textAlign: 'center' },

  // Breadcrumb: outer View fixes height, inner ScrollView handles overflow
  breadcrumbOuter: {
    height: 44,
    backgroundColor: colors.card,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    justifyContent: 'center',
  },
  breadcrumbInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, gap: 8, height: 44,
  },
  breadcrumbHomeBtn: { justifyContent: 'center', height: 44 },
  crumb: { fontSize: 14, color: colors.text.secondary, fontWeight: '500' },
  crumbActive: { color: colors.business, fontWeight: '700' },

  // Content fills all remaining space
  content: { flex: 1 },

  listContent: { padding: 16, paddingBottom: 100 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14,
    padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  rowFirst: {},
  rowThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: colors.background },
  rowIconWrap: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, marginHorizontal: 12 },
  rowName: { fontSize: 14, fontWeight: '600', color: colors.text.primary, marginBottom: 3 },
  rowSub: { fontSize: 12, color: colors.text.muted },
  rowRight: { justifyContent: 'center', alignItems: 'center', minWidth: 24 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 20, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text.secondary, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.text.muted, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.business,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.business, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },

  addSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  addSheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary, marginBottom: 12 },
  addOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  addOptionIcon: { width: 42, height: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  addOptionLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text.primary },

  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  dialogCard: { backgroundColor: colors.card, borderRadius: 20, padding: 24, gap: 16 },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: colors.text.primary },
  dialogInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: colors.text.primary,
  },
  dialogBtns: { flexDirection: 'row', gap: 10 },
  dialogCancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: colors.background, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  dialogCancelText: { fontSize: 15, fontWeight: '600', color: colors.text.secondary },
  dialogOkBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.business, alignItems: 'center' },
  dialogOkText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  detailSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36,
  },
  imagePreview: { width: '100%', height: 180, borderRadius: 12, marginBottom: 16, backgroundColor: colors.background },
  detailHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 16 },
  detailIconWrap: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailName: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 4 },
  detailMeta: { fontSize: 12, color: colors.text.muted, lineHeight: 18 },
  detailActions: { gap: 8 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 13, borderRadius: 12,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600' },

  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerImageArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewerCloseBtn: {
    position: 'absolute', top: 48, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  viewerBottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 20, paddingBottom: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  viewerBottomBtn: { alignItems: 'center', gap: 6 },
  viewerBottomText: { fontSize: 12, color: '#fff', fontWeight: '500' },
});
