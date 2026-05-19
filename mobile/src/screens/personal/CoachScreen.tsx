import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { personalAPI } from '../../services/api';
import QuizModal from '../../components/education/QuizModal';
import ProgressBar from '../../components/education/ProgressBar';

const STORAGE_KEY = 'coach_completed_v2';

type Q = { question: string; options: string[]; answer: number };
type Lesson = { id: string; title: string; content: string; quiz: Q[] };
type Topic = { id: string; title: string; icon: string; lessons: Lesson[] };
type LevelData = { level: 1 | 2 | 3; title: string; subtitle: string; color: string; bg: string; topics: Topic[] };

const CURRICULUM: LevelData[] = [
  {
    level: 1, title: 'Temel', subtitle: "Finansın ABC'si",
    color: '#10B981', bg: '#ECFDF5',
    topics: [
      {
        id: 'l1_t1', title: 'Para Yönetimi', icon: 'wallet-outline',
        lessons: [
          {
            id: 'l1_t1_l1', title: 'Bütçe Oluşturma',
            content: 'Bütçe, gelirinizi ve giderlerinizi planlamanın temel aracıdır. 50/30/20 kuralına göre gelirinizin %50\'sini zorunlu giderlere (kira, faturalar), %30\'unu isteğe bağlı harcamalara ve %20\'sini tasarrufa ayırabilirsiniz.\n\nBütçe oluştururken önce aylık net gelirinizi belirleyin. Ardından sabit giderler (her ay aynı kalan: kira, abonelikler) ve değişken giderler (market, ulaşım, eğlence) ayrımını yapın.\n\nDüzenli bütçe takibi, gereksiz harcamaları azaltmanıza ve finansal hedeflerinize daha hızlı ulaşmanıza yardımcı olur.',
            quiz: [
              { question: '50/30/20 kuralına göre tasarrufa ayrılan oran nedir?', options: ['%10', '%20', '%30', '%50'], answer: 1 },
              { question: 'Hangisi sabit gidere örnektir?', options: ['Market alışverişi', 'Eğlence harcaması', 'Kira ödemesi', 'Giyim'], answer: 2 },
            ],
          },
          {
            id: 'l1_t1_l2', title: 'Harcama Takibi',
            content: 'Harcamalarınızı düzenli takip etmek, para sızıntılarını tespit etmenin en etkili yoludur. Küçük günlük harcamalar (kahve, ulaşım, abonelikler) farkında olmadan büyük miktarlara ulaşabilir.\n\nEtkili harcama takibi için: her harcamayı anında kategorilere göre kaydedin. Aylık sonunda hangi kategorilerde bütçenizi aştığınızı analiz edin.\n\nAraştırmalar, harcamalarını takip eden kişilerin ortalama %15-20 daha az harcadığını göstermektedir. Farkında olmak bile harcama davranışlarınızı olumlu yönde değiştirmeye başlar.',
            quiz: [
              { question: 'Harcama takibinin en önemli faydası nedir?', options: ['Daha fazla harcamak', 'Para sızıntılarını tespit etmek', 'Kredi notu artırmak', 'Vergi avantajı'], answer: 1 },
              { question: 'Harcamalarını takip edenler ortalama ne kadar tasarruf ediyor?', options: ['%5-10', '%15-20', '%30-40', '%50'], answer: 1 },
            ],
          },
          {
            id: 'l1_t1_l3', title: 'Acil Durum Fonu',
            content: 'Acil durum fonu, beklenmedik masraflar için hazır tutulan ve kolayca erişilebilen bir tasarruf deposudur. İş kaybı, sağlık sorunu veya araç arızası gibi durumlar için finansal güvenceniz olur.\n\nFinansal uzmanlar, 3 ila 6 aylık yaşam giderini acil durum fonunda tutmanızı önerir. Bu fon, yatırım araçlarında değil, vadesiz ya da kısa vadeli mevduat hesabında tutulmalıdır.\n\nAcil durum fonunuz yoksa, her ay küçük miktarlarla başlayın. Önce 1 aylık gideri tutturun, ardından 3-6 aya çıkarın.',
            quiz: [
              { question: 'Acil durum fonu için önerilen tutar nedir?', options: ['1 aylık gelir', '3-6 aylık yaşam gideri', '1 yıllık gelir', 'Sabit 50.000 TL'], answer: 1 },
              { question: 'Acil durum fonu nerede tutulmalıdır?', options: ['Hisse senedinde', 'Kripto parada', 'Kolay erişilebilen mevduat hesabında', 'Gayrimenkulde'], answer: 2 },
            ],
          },
        ],
      },
      {
        id: 'l1_t2', title: 'Temel Finans Kavramları', icon: 'book-outline',
        lessons: [
          {
            id: 'l1_t2_l1', title: 'Faiz ve Bileşik Faiz',
            content: 'Faiz, ödünç aldığınız veya yatırdığınız paranın kullanımı karşılığında ödenen ya da kazanılan bedeldir. Basit faizde yalnızca anapara üzerinden faiz hesaplanır.\n\nBileşik faiz ise "faizin faizi" prensibiyle çalışır. Kazandığınız faiz de bir sonraki dönemde faiz getirir. 100 TL\'yi yıllık %10 basit faizle 10 yılda 200 TL yaparken, bileşik faizle yaklaşık 259 TL\'ye ulaşırsınız.\n\nBileşik faizin gücünden yararlanmak için erken başlamak ve yatırımları uzun süre elde tutmak kritik önem taşır.',
            quiz: [
              { question: 'Bileşik faizin basit faizden farkı nedir?', options: ['İkisi aynıdır', 'Bileşikte faize de faiz işler', 'Bileşik faiz daha azdır', 'Basit faiz uzun vadede daha iyi'], answer: 1 },
              { question: '100 TL yıllık %10 basit faizle 10 yılda kaç TL olur?', options: ['150 TL', '200 TL', '259 TL', '300 TL'], answer: 1 },
            ],
          },
          {
            id: 'l1_t2_l2', title: 'Enflasyon ve Satın Alma Gücü',
            content: 'Enflasyon, fiyatların genel seviyesinin zamanla yükselmesidir. Enflasyon arttıkça paranızın satın alma gücü azalır — bugün 100 TL\'ye aldığınız şey, %10 enflasyonla bir yıl sonra 110 TL olur.\n\nYüksek enflasyon dönemlerinde nakit tutmak dezavantajlıdır; paranızın reel değeri her geçen gün düşer. Bu nedenle yatırımlarınızın enflasyonu aşan getiri sağlaması hedeflenir.\n\nEnflasyona karşı korunmak için altın, döviz, hisse senedi veya enflasyona endeksli mevduat gibi araçlar kullanılabilir.',
            quiz: [
              { question: 'Enflasyon yükseldiğinde paranın satın alma gücüne ne olur?', options: ['Artar', 'Değişmez', 'Azalır', 'İkiye katlanır'], answer: 2 },
              { question: 'Enflasyona karşı korunmak için hangisi kullanılabilir?', options: ['Yastık altı nakit', 'Vadesiz hesap', 'Hisse senedi veya altın', 'Kredi kartı'], answer: 2 },
            ],
          },
          {
            id: 'l1_t2_l3', title: 'Net Değer Hesaplama',
            content: 'Net değer, finansal sağlığınızın en kapsamlı göstergesidir:\n\nNet Değer = Toplam Varlıklar − Toplam Borçlar\n\nVarlıklar: nakit, banka mevduatı, hisse senedi, altın, araç, gayrimenkul.\nBorçlar: kredi kartı borcu, tüketici kredisi, konut kredisi.\n\nNet değerinizi her 6 ayda bir hesaplayın. Pozitif ve büyüyen bir net değer, sağlıklı finansal kararlar aldığınızı gösterir. Negatifse borçları önceliklendirip sistematik bir ödeme planı oluşturun.',
            quiz: [
              { question: 'Net değer nasıl hesaplanır?', options: ['Gelir - Gider', 'Varlıklar + Borçlar', 'Varlıklar - Borçlar', 'Tasarruf × Faiz'], answer: 2 },
              { question: 'Hangisi bir "borç" (yükümlülük) örneğidir?', options: ['Banka mevduatı', 'Hisse senedi', 'Konut kredisi', 'Altın'], answer: 2 },
            ],
          },
        ],
      },
      {
        id: 'l1_t3', title: 'Düşük Riskli Yatırımlar', icon: 'shield-outline',
        lessons: [
          {
            id: 'l1_t3_l1', title: 'Banka Mevduatları',
            content: 'Banka mevduatı, en yaygın ve güvenli tasarruf araçlarından biridir. Vadesiz mevduatta paranıza istediğiniz zaman erişebilirsiniz; ancak faiz oranı düşüktür. Vadeli mevduatta ise belirli bir süre paranızı bağlarsınız ve daha yüksek faiz kazanırsınız.\n\nTürkiye\'de mevduat hesapları devlet güvencesi kapsamındadır. Bu güvence her banka için ayrı ayrı belirli bir tutara kadar geçerlidir.\n\nMevduat, acil durum fonu ve kısa vadeli tasarruf için idealdir. Ancak tek başına uzun vadeli yatırım aracı olarak yeterli olmayabilir.',
            quiz: [
              { question: 'Vadeli mevduatın vadesiz mevduattan farkı nedir?', options: ['Daha az güvenlidir', 'Daha yüksek faiz verir ama süre bağlar', 'Her zaman daha az faiz verir', 'Devlet garantisi yoktur'], answer: 1 },
              { question: 'Mevduat hesabı hangi amaç için en uygundur?', options: ['Uzun vadeli servet birikimi', 'Hisse senedi alımı', 'Acil durum fonu ve kısa vadeli tasarruf', 'Emeklilik planlaması'], answer: 2 },
            ],
          },
          {
            id: 'l1_t3_l2', title: 'Devlet Tahvili ve Hazine Bonosu',
            content: 'Devlet tahvili ve hazine bonosu, devletin borçlanma aracı olarak ihraç ettiği menkul kıymetlerdir. Yatırımcılar bu araçları satın alarak devlete borç verir ve karşılığında faiz geliri alır.\n\nHazine bonosu genellikle 1 yıl ve altı vadeli; devlet tahvili ise 1 yıldan uzun vadeli olabilir. Devlet garantisi taşıdığından en düşük riskli yatırım araçlarından sayılır.\n\nBankalar ve aracı kurumlar aracılığıyla kolayca satın alınabilir. Özellikle risk almak istemeyen yatırımcılar için uygun bir tercihdir.',
            quiz: [
              { question: 'Hazine bonosunun vadesi genellikle ne kadardır?', options: ['1 yıldan uzun', '5 yıl', '1 yıl ve altı', '10 yıl'], answer: 2 },
              { question: 'Devlet tahvilinin en önemli özelliği nedir?', options: ['Yüksek getiri garantisi', 'Devlet garantisi ile düşük risk', 'Hisse senedinden daha yüksek getiri', 'Enflasyonu mutlaka geçer'], answer: 1 },
            ],
          },
          {
            id: 'l1_t3_l3', title: 'Altın Yatırımı',
            content: 'Altın, tarihin en eski yatırım araçlarından biridir ve enflasyona karşı güçlü bir koruma sağlar. Ekonomik krizlerde ve belirsizlik dönemlerinde "güvenli liman" olarak talep görür.\n\nTürkiye\'de altına yatırım yolları: fiziksel altın (gram altın, cumhuriyet altını), altın hesabı veya altın fonu. Fiziksel altında işçilik payı ve saklama maliyeti oluşabilir.\n\nAltın fiyatı döviz kuruna bağlıdır; TL değer kaybettikçe altının TL fiyatı yükselir. Bu nedenle hem enflasyon hem döviz riskine karşı koruma sağlar.',
            quiz: [
              { question: 'Altın hangi dönemlerde özellikle talep görür?', options: ['Ekonomik büyüme dönemlerinde', 'Belirsizlik ve kriz dönemlerinde', 'Düşük enflasyon dönemlerinde', 'Faiz oranları yükseldiğinde'], answer: 1 },
              { question: 'Fiziksel altın alımında oluşabilecek ek maliyet nedir?', options: ['Devlet vergisi', 'İşçilik payı', 'BDDK ücreti', 'Döviz komisyonu'], answer: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    level: 2, title: 'Orta', subtitle: 'Yatırıma İlk Adım',
    color: '#3B82F6', bg: '#EFF6FF',
    topics: [
      {
        id: 'l2_t1', title: 'Borsa Temelleri', icon: 'trending-up-outline',
        lessons: [
          {
            id: 'l2_t1_l1', title: 'Hisse Senedi Nedir?',
            content: 'Hisse senedi, bir şirketin sermayesini temsil eden ve o şirkete ortak olmanızı sağlayan menkul kıymettir. Hisse satın aldığınızda o şirketin küçük bir ortağı olursunuz.\n\nHisse sahibi iki yoldan gelir elde edebilir: temettü (kar payı dağıtımı) ve değer artışı (fiyat yükselmesi). Ancak hisse fiyatları düşebilir; bu nedenle risk içerir.\n\nBorsa İstanbul (BIST)\'da işlem gören hisseleri bankalar veya aracı kurumlar üzerinden satın alabilirsiniz. Yatırım öncesi şirketin finansallarını ve sektör durumunu araştırmak önemlidir.',
            quiz: [
              { question: 'Hisse senedi sahibinin gelir elde etme yolları nelerdir?', options: ['Sadece temettü', 'Sadece değer artışı', 'Temettü ve değer artışı', 'Faiz geliri'], answer: 2 },
              { question: 'Türkiye\'deki borsa nedir?', options: ['NYSE', 'NASDAQ', 'BIST', 'LSE'], answer: 2 },
            ],
          },
          {
            id: 'l2_t1_l2', title: 'Borsa Endeksleri',
            content: 'Borsa endeksi, seçilmiş bir grup hisse senedinin genel performansını ölçen göstergedir. Piyasanın genel gidişatını tek bir sayıyla ifade eder.\n\nBIST 100, Türkiye\'nin en büyük 100 şirketini kapsayan ana endeksimizdir. Dünya genelinde S&P 500 (ABD\'nin 500 büyük şirketi), Dow Jones ve NASDAQ öne çıkar.\n\nEndeks yatırımı, tek tek hisse seçmeden piyasanın ortalama getirisini yakalamayı sağlar. Endeks fonu veya ETF\'ler aracılığıyla bu endekslere kolayca yatırım yapılabilir.',
            quiz: [
              { question: 'BIST 100 neyi temsil eder?', options: ['Tüm Türk şirketlerini', 'En büyük 100 Türk şirketini', 'Sadece bankacılık sektörünü', 'En küçük 100 şirketi'], answer: 1 },
              { question: 'Endeks yatırımının en büyük avantajı nedir?', options: ['Her zaman piyasayı geçer', 'Çeşitlendirme ve düşük maliyet', 'Yüksek temettü geliri', 'Kısa vadede yüksek getiri'], answer: 1 },
            ],
          },
          {
            id: 'l2_t1_l3', title: 'Temel Analiz',
            content: 'Temel analiz, bir hisse senedinin "gerçek değerini" bulmaya çalışan yöntemdir. Şirketin mali tablolarını, iş modelini, sektör durumunu ve makroekonomik koşulları inceler.\n\nTemel analiz araçları:\n• F/K Oranı (Fiyat/Kazanç): Piyasa fiyatının hisse başı kara bölümü. Düşük F/K ucuz hisse sinyali olabilir.\n• PD/DD: Hissenin varlıklarına göre pahalı mı ucuz mu olduğunu gösterir.\n• Temettü Verimi: Yatırım tutarına göre yıllık temettü oranı.\n\nTemel analiz, uzun vadeli yatırımcılar için özellikle değerlidir.',
            quiz: [
              { question: 'F/K oranı neyi ölçer?', options: ['Şirketin borç oranını', 'Piyasa fiyatının hisse başı kara oranını', 'Temettü verimini', 'Döviz riskini'], answer: 1 },
              { question: 'Temel analiz hangi yatırımcı tipi için daha uygundur?', options: ['Günlük alım-satım yapanlar', 'Kısa vadeciler', 'Uzun vadeli yatırımcılar', 'Teknik analistler'], answer: 2 },
            ],
          },
        ],
      },
      {
        id: 'l2_t2', title: 'Yatırım Araçları', icon: 'layers-outline',
        lessons: [
          {
            id: 'l2_t2_l1', title: 'Yatırım Fonları',
            content: 'Yatırım fonu, birçok yatırımcının parasını bir havuzda toplayarak profesyonel bir portföy yöneticisinin yönettiği yatırım aracıdır. Küçük tutarlarla çeşitlendirilmiş bir portföye sahip olmanızı sağlar.\n\nFon türleri: hisse senedi fonu, tahvil fonu, karma fon, para piyasası fonu. Her fonun farklı risk-getiri profili vardır.\n\nAvantajları: profesyonel yönetim, çeşitlendirme, düşük minimum yatırım. Dezavantajı ise yönetim ücreti (yıllık %0.5-2) ve aktif yönetimin endeks fonlarına kıyasla bazen düşük performansıdır.',
            quiz: [
              { question: 'Yatırım fonunun en önemli avantajı nedir?', options: ['Garantili yüksek getiri', 'Profesyonel yönetim ve çeşitlendirme', 'Vergiden muafiyet', 'Sınırsız getiri'], answer: 1 },
              { question: 'Yatırım fonlarında "yönetim ücreti" ne anlama gelir?', options: ['Giriş ücreti', 'Fon yöneticisine ödenen yıllık ücret', 'Devlet vergisi', 'Saklama ücreti'], answer: 1 },
            ],
          },
          {
            id: 'l2_t2_l2', title: 'Borsa Yatırım Fonları (ETF)',
            content: 'ETF (Exchange Traded Fund), hisse senedi gibi borsada işlem gören ve genellikle bir endeksi takip eden fondur. BIST 100 endeksini takip eden bir ETF, o endeksteki tüm hisseleri içerir.\n\nETF\'lerin avantajları:\n• Gerçek zamanlı alım-satım imkânı\n• Düşük yönetim ücreti (%0.1-0.5)\n• Şeffaflık ve kolay çeşitlendirme\n\nAraştırmalar, uzun vadede aktif fon yöneticilerinin büyük çoğunluğunun endeks ETF\'lerini geçemediğini göstermektedir.',
            quiz: [
              { question: 'ETF ile normal yatırım fonu arasındaki temel fark nedir?', options: ['ETF daha risklidir', 'ETF borsada gerçek zamanlı işlem görür', 'ETF sadece tahvil içerir', 'ETF daha pahalıdır'], answer: 1 },
              { question: 'ETF\'lerin yönetim ücreti geleneksel fonlara göre nasıldır?', options: ['Daha yüksektir', 'Aynıdır', 'Daha düşüktür', 'Ücretsizdir'], answer: 2 },
            ],
          },
          {
            id: 'l2_t2_l3', title: 'Tahvil Yatırımı',
            content: 'Tahvil, şirket veya hükümetlerin borçlanmak için çıkardığı sabit getirili menkul kıymettir. Tahvil aldığınızda ihraç eden kuruluşa borç vermiş olursunuz; karşılığında düzenli faiz (kupon) ve vade sonunda anaparanızı alırsınız.\n\nTahvil türleri:\n• Devlet tahvili: En güvenli, daha düşük faiz\n• Şirket tahvili: Daha yüksek faiz ama daha fazla risk\n• Eurobond: Döviz cinsinden tahvil\n\nTahvil fiyatı ile faiz oranı ters orantılıdır: faizler yükselirse eski tahvillerin fiyatı düşer.',
            quiz: [
              { question: 'Tahvil yatırımından elde edilen düzenli gelire ne denir?', options: ['Temettü', 'Kupon ödemesi', 'Değer artışı', 'Komisyon'], answer: 1 },
              { question: 'Piyasa faiz oranları yükseldiğinde mevcut tahvil fiyatlarına ne olur?', options: ['Yükselir', 'Değişmez', 'Düşer', 'İkiye katlanır'], answer: 2 },
            ],
          },
        ],
      },
      {
        id: 'l2_t3', title: 'Risk ve Strateji', icon: 'analytics-outline',
        lessons: [
          {
            id: 'l2_t3_l1', title: 'Yatırımda Risk Yönetimi',
            content: 'Risk, yatırımınızın beklenen getirisinden sapma ihtimalidir. Her yatırım belirli düzeyde risk içerir.\n\nRisk türleri:\n• Piyasa riski: Genel piyasa düşüşlerinden etkilenme\n• Likidite riski: Gerektiğinde nakde çevirme güçlüğü\n• Kur riski: Döviz değişimlerinden etkilenme\n• Enflasyon riski: Getirinin enflasyonun altında kalması\n\n"Kaybetmeyi göze alamayacağınız parayı riskli yatırımlara koymayın." Stop-loss emirleri, pozisyon büyüklüğü yönetimi ve çeşitlendirme, riski kontrol altına almanın temel araçlarıdır.',
            quiz: [
              { question: 'Likidite riski nedir?', options: ['Faiz oranı değişimi riski', 'Gerektiğinde nakde çevirme güçlüğü', 'Döviz değişim riski', 'Şirket iflas riski'], answer: 1 },
              { question: 'Hangi araç yatırım riskini kontrol altına almaya yardımcı olur?', options: ['Tek hisseye yatırım', 'Kaldıraç kullanımı', 'Stop-loss emirleri', 'Günlük alım-satım'], answer: 2 },
            ],
          },
          {
            id: 'l2_t3_l2', title: 'Portföy Çeşitlendirme',
            content: '"Tüm yumurtaları aynı sepete koyma" prensibi, portföy çeşitlendirmesinin özüdür. Farklı varlık sınıflarına yatırım yaparak bir varlığın değer kaybının tüm portföyü etkilemesini önlersiniz.\n\nÇeşitlendirme boyutları:\n• Varlık sınıfı: Hisse senedi, tahvil, altın, gayrimenkul\n• Coğrafya: Türkiye, ABD, Avrupa piyasaları\n• Sektör: Teknoloji, enerji, sağlık, finans\n• Zaman: Düzenli aralıklarla alım (maliyet ortalaması)\n\nÇeşitlendirme her koşulda kar garantisi vermez; ancak tek bir şirket veya sektörün kötü gidişatından büyük zarar görme riskinizi önemli ölçüde azaltır.',
            quiz: [
              { question: 'Portföy çeşitlendirmesinin amacı nedir?', options: ['Maksimum getiri', 'Tek bir yatırıma odaklanmak', 'Riski dağıtarak kayıpları azaltmak', 'Komisyon ödemelerini azaltmak'], answer: 2 },
              { question: 'Hangisi bir çeşitlendirme boyutu değildir?', options: ['Varlık sınıfı', 'Sektör', 'Coğrafya', 'Renk'], answer: 3 },
            ],
          },
          {
            id: 'l2_t3_l3', title: 'Uzun Vadeli Yatırım Stratejisi',
            content: 'Uzun vadeli yatırım, piyasanın kısa vadeli dalgalanmalarını görmezden gelerek yıllarca yatırımını sürdürme stratejisidir. Tarihsel veriler, uzun vadede hisse senedi piyasalarının her kriz dönemini aşarak yukarı yönde gittiğini göstermektedir.\n\nTemel ilkeler:\n• Düzenli alım (aylık sabit tutarda yatırım)\n• Temettüleri yeniden yatırıma çevirme\n• Paniğe kapılmama\n• Bileşik faizin gücünden yararlanma\n\n"Piyasada geçirilen süre, piyasayı zamanlamaktan daha önemlidir." — Uzun vadeli yatırımın özü budur.',
            quiz: [
              { question: 'Uzun vadeli yatırım stratejisinin temel ilkelerinden biri hangisidir?', options: ['Her gün alım-satım', 'Düzenli aralıklarla sabit tutarda yatırım', 'Sadece kripto para', 'Düşüşte satmak'], answer: 1 },
              { question: '"Piyasada geçirilen süre zamanlamadan daha önemlidir" ne anlama gelir?', options: ['Her gün işlem yapmalısın', 'Erken başlayıp uzun süre tutmak daha önemlidir', 'Piyasa zamanlaması mükemmeldir', 'Kısa vade daha iyidir'], answer: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    level: 3, title: 'İleri', subtitle: 'Profesyonel Stratejiler',
    color: '#8B5CF6', bg: '#F5F3FF',
    topics: [
      {
        id: 'l3_t1', title: 'Teknik Analiz', icon: 'bar-chart-outline',
        lessons: [
          {
            id: 'l3_t1_l1', title: 'Grafik Türleri ve Okuma',
            content: 'Teknik analiz, geçmiş fiyat hareketlerini kullanarak gelecekteki fiyat yönünü tahmin etmeye çalışır. Temel araçları fiyat grafikleridir.\n\nBaşlıca grafik türleri:\n• Çizgi grafiği: Kapanış fiyatlarını birleştirir; basit görünüm.\n• Bar grafiği (OHLC): Açılış, yüksek, düşük ve kapanışı gösterir.\n• Mum (Candle) grafiği: En yaygın kullanılan.\n\nMum grafiğinde yeşil mum kapanışın açılıştan yüksek olduğunu (yukarı hareket), kırmızı mum ise kapanışın açılıştan düşük olduğunu (aşağı hareket) temsil eder.',
            quiz: [
              { question: 'Teknik analizde en yaygın kullanılan grafik türü hangisidir?', options: ['Çizgi grafiği', 'Bar grafiği', 'Mum (candlestick) grafiği', 'Pasta grafiği'], answer: 2 },
              { question: 'Mum grafiğinde yeşil mum ne anlama gelir?', options: ['Kapanış açılıştan düşük', 'Kapanış açılıştan yüksek', 'Fiyat değişmedi', 'Hacim arttı'], answer: 1 },
            ],
          },
          {
            id: 'l3_t1_l2', title: 'Destek, Direnç ve Trend',
            content: 'Destek seviyesi, fiyatın düşerken taban yaptığı ve alıcıların devreye girdiği bölgedir. Direnç ise fiyatın yükselirken tavan yaptığı bölgedir.\n\nTrend türleri:\n• Yükselen trend (bull): Daha yüksek yüksekler ve düşükler\n• Düşen trend (bear): Daha düşük yüksekler ve düşükler\n• Yatay (range): Belirli bir bantta hareket\n\n"Trend senin arkadaşın" prensibi, trendin yönünde işlem yapmanın istatistiksel olarak daha avantajlı olduğunu ifade eder. Destek kırılırsa direnç olur, direnç kırılırsa destek olur.',
            quiz: [
              { question: 'Destek seviyesi nedir?', options: ['Fiyatın tavan yaptığı bölge', 'Fiyatın taban yaptığı ve alıcıların devreye girdiği bölge', 'Trend kanalının üst sınırı', 'Hacim zirvesi'], answer: 1 },
              { question: 'Yükselen trend nasıl tanımlanır?', options: ['Sabit fiyat hareketi', 'Daha düşük yüksekler', 'Daha yüksek yüksekler ve düşükler', 'Yalnızca hacim artışı'], answer: 2 },
            ],
          },
          {
            id: 'l3_t1_l3', title: 'Teknik İndikatörler',
            content: 'Teknik indikatörler, fiyat ve hacim verilerinden türetilen matematiksel hesaplamalardır.\n\nTemel indikatörler:\n• Hareketli Ortalama (MA): Belirli periyottaki ortalama fiyat. 50 ve 200 günlük MA kesişimi güçlü sinyal verir.\n• RSI (Göreceli Güç Endeksi): 0-100 arası; 70 üzeri aşırı alım, 30 altı aşırı satım.\n• MACD: İki hareketli ortalamanın farkı; trend değişimlerini erken fark ettirir.\n• Bollinger Bantları: Fiyatın volatilite bandını gösterir.\n\nİndikatörler tek başına değil, birlikte kullanıldığında daha güvenilir sinyal üretir.',
            quiz: [
              { question: 'RSI 70 üzerine çıktığında ne anlama gelir?', options: ['Aşırı satım', 'Aşırı alım', 'Güçlü yükselen trend', 'Düşük volatilite'], answer: 1 },
              { question: '50 ve 200 günlük MA kesişimi neden önemlidir?', options: ['Likidite göstergesidir', 'Trend değişim sinyali olabilir', 'Temettü zamanını gösterir', 'Sadece kısa vadede geçerli'], answer: 1 },
            ],
          },
        ],
      },
      {
        id: 'l3_t2', title: 'Uluslararası Piyasalar', icon: 'globe-outline',
        lessons: [
          {
            id: 'l3_t2_l1', title: 'Döviz Piyasaları (Forex)',
            content: 'Forex (Foreign Exchange), dünyanın en büyük ve en likit piyasasıdır. Günlük işlem hacmi 7 trilyon doların üzerindedir. Haftanın 5 günü 24 saat açıktır.\n\nTemel döviz çiftleri: EUR/USD, GBP/USD, USD/JPY, USD/TRY.\n\nDöviz fiyatını etkileyen faktörler: merkez bankası faiz kararları, enflasyon verileri, cari açık/fazla ve jeopolitik riskler.\n\nForex piyasasında kaldıraç yaygın kullanılır; bu hem kazançları hem kayıpları büyütür. Deneyimsiz yatırımcılar için yüksek risk taşır.',
            quiz: [
              { question: 'Forex piyasasının en belirgin özelliği nedir?', options: ['Sadece hisse senedi işlenir', '7 trilyon üzerinde günlük hacim, 24 saat açık', 'Yalnızca hafta içi işlem görür', 'Sadece kripto paralar işlenir'], answer: 1 },
              { question: 'Döviz kurunu etkileyen faktörlerden biri hangisidir?', options: ['Şirket temettüleri', 'Merkez bankası faiz kararları', 'Hisse senedi endeksi', 'Altın işçiliği'], answer: 1 },
            ],
          },
          {
            id: 'l3_t2_l2', title: 'Küresel Piyasalar ve Endeksler',
            content: 'Küresel piyasalar birbirine bağlıdır; ABD borsasındaki büyük düşüşler gelişmekte olan piyasaları da etkiler.\n\nÖnemli küresel endeksler:\n• S&P 500: ABD\'nin en büyük 500 şirketi; küresel referans endeks\n• Dow Jones (DJIA): ABD\'nin 30 büyük şirketi\n• NASDAQ 100: Teknoloji ağırlıklı ABD endeksi\n• FTSE 100: İngiltere\'nin 100 büyük şirketi\n• DAX 40: Almanya\'nın 40 büyük şirketi\n\nGelişmiş piyasalar daha stabil; gelişmekte olan piyasalar (Türkiye dahil) daha yüksek risk ve getiri potansiyeli taşır.',
            quiz: [
              { question: 'ABD\'nin 500 büyük şirketini kapsayan küresel referans endeks hangisidir?', options: ['NASDAQ 100', 'Dow Jones', 'S&P 500', 'FTSE 100'], answer: 2 },
              { question: 'Gelişmekte olan piyasaların özelliği nedir?', options: ['Her zaman daha düşük getiri', 'Daha yüksek risk ve getiri potansiyeli', 'Daha stabil fiyat hareketi', 'ABD piyasasından etkilenmez'], answer: 1 },
            ],
          },
          {
            id: 'l3_t2_l3', title: 'Uluslararası Çeşitlendirme',
            content: 'Uluslararası çeşitlendirme, yatırımlarınızı yalnızca Türkiye ile sınırlı tutmayıp farklı ülke piyasalarına yaymaktır. Ülkeye özgü riskleri (siyasi kriz, döviz değer kaybı) azaltır.\n\nUluslararası yatırım araçları:\n• Global ETF\'ler (S&P 500 ETF, MSCI World ETF)\n• Yabancı para cinsinden tahvil ve mevduat (Eurobond)\n• Global yatırım fonları\n\nDikkate alınması gereken riskler: kur riski, vergi durumu ve aracı kurumun güvenilirliği. Eurobond ve dövizli mevduat, Türk yatırımcılar için en pratik başlangıç noktalarındandır.',
            quiz: [
              { question: 'Uluslararası çeşitlendirmenin temel amacı nedir?', options: ['Sadece yüksek getiri', 'Ülkeye özgü riskleri azaltmak', 'Vergi ödemekten kaçınmak', 'Tek piyasaya odaklanmak'], answer: 1 },
              { question: 'Türk yatırımcı için en pratik uluslararası çeşitlendirme aracı nedir?', options: ['Doğrudan ABD hissesi', 'Kripto para', 'Eurobond veya dövizli mevduat', 'Yurt dışı gayrimenkul'], answer: 2 },
            ],
          },
        ],
      },
      {
        id: 'l3_t3', title: 'Kaldıraç ve Türev Piyasalar', icon: 'flash-outline',
        lessons: [
          {
            id: 'l3_t3_l1', title: 'Kaldıraçlı İşlemler',
            content: 'Kaldıraç, sahip olduğunuzdan daha büyük pozisyon açmanızı sağlar. 1:10 kaldıraçla 1.000 TL ile 10.000 TL\'lik işlem yapabilirsiniz.\n\nKaldıraç kazançları da kayıpları da büyütür:\n• Fiyat %10 yükselirse: 1.000 TL teminatla 1.000 TL kazanç (%100 getiri)\n• Fiyat %10 düşerse: 1.000 TL teminat tamamen kaybolur\n\nMargin call: Teminat kritik seviyeye düştüğünde aracı kurum ek teminat ister veya pozisyonu zorla kapatır.\n\nKaldıraçlı işlemler deneyimsizler için ciddi kayıplara yol açabilir; mutlaka risk yönetimiyle kullanılmalıdır.',
            quiz: [
              { question: '1:10 kaldıraç ne anlama gelir?', options: ['10 kat daha az risk', 'Sahip olduğunun 10 katı büyüklükte işlem yapabilmek', '10 farklı hisse almak', 'Yıllık %10 faiz'], answer: 1 },
              { question: '"Margin call" ne anlama gelir?', options: ['Kâr payı dağıtımı', 'Teminat yetersiz kaldığında ek teminat talebi', 'Pozisyon büyütme', 'Temettü bildirimi'], answer: 1 },
            ],
          },
          {
            id: 'l3_t3_l2', title: 'Vadeli İşlem Sözleşmeleri',
            content: 'Vadeli işlem sözleşmesi (futures), belirli bir varlığı ileriki bir tarihte, bugünden belirlenen fiyattan alma veya satma yükümlülüğü içeren standarize sözleşmedir.\n\nKullanım amaçları:\n• Korunma (hedging): Tarımsal üreticiler hasat fiyat riskine, ihracatçılar döviz riskine karşı\n• Spekülatif kazanç: Fiyat hareketlerinden yararlanmak\n\nTürkiye\'de VIOP (Vadeli İşlem ve Opsiyon Piyasası)\'nda döviz, endeks ve emtia üzerine vadeli sözleşmeler işlem görmektedir.\n\nVadeli işlemler yükümlülük içerir — vade geldiğinde yerine getirmek zorunludur.',
            quiz: [
              { question: 'Vadeli işlem sözleşmesi nedir?', options: ['Anlık alım-satım işlemi', 'Gelecekte belirli fiyattan alım-satım yükümlülüğü', 'Sadece hisse senedi için kullanılır', 'Mevduat türü'], answer: 1 },
              { question: 'Türkiye\'de vadeli işlemler hangi piyasada gerçekleşir?', options: ['BIST 100', 'VIOP', 'Forex', 'NASDAQ'], answer: 1 },
            ],
          },
          {
            id: 'l3_t3_l3', title: 'Opsiyon Sözleşmeleri',
            content: 'Opsiyon sözleşmesi, belirli bir varlığı belirlenen fiyattan belirlenen tarihte veya öncesinde alma (call) ya da satma (put) hakkı verir — zorunluluk değil.\n\nTemel kavramlar:\n• Call opsiyonu: Varlığı satın alma hakkı (fiyat yükselişinden kazanmak için)\n• Put opsiyonu: Varlığı satma hakkı (fiyat düşüşünden kazanmak veya korunmak için)\n• Prim: Opsiyon için ödenen bedel\n• Vade sonu: Opsiyonun geçerli olduğu son tarih\n\nOpsiyon alıcısının maksimum kaybı ödediği primdir. Satıcının riski ise teorik olarak sınırsızdır.',
            quiz: [
              { question: 'Call opsiyonu neyi temsil eder?', options: ['Satma hakkı', 'Satın alma hakkı', 'Satın alma zorunluluğu', 'Satma zorunluluğu'], answer: 1 },
              { question: 'Opsiyon alan yatırımcının maksimum kaybı nedir?', options: ['Sınırsız', 'Varlığın tam değeri', 'Ödediği prim kadar', 'Hesap bakiyesi'], answer: 2 },
            ],
          },
        ],
      },
    ],
  },
];

// ---- LessonModal ----
function LessonModal({
  lesson,
  visible,
  onClose,
  onComplete,
}: {
  lesson: Lesson;
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    if (!visible) setShowQuiz(false);
  }, [visible]);

  if (showQuiz) {
    return (
      <QuizModal
        visible={visible}
        questions={lesson.quiz}
        xp={50}
        onComplete={() => { onComplete(); }}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={lStyles.safe}>
        <View style={lStyles.header}>
          <TouchableOpacity onPress={onClose} style={lStyles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={lStyles.title} numberOfLines={1}>{lesson.title}</Text>
          <View style={{ width: 36 }} />
        </View>
        <ScrollView style={lStyles.scroll} contentContainerStyle={lStyles.scrollContent}>
          <Text style={lStyles.content}>{lesson.content}</Text>
        </ScrollView>
        <View style={lStyles.footer}>
          <TouchableOpacity style={lStyles.quizBtn} onPress={() => setShowQuiz(true)}>
            <Ionicons name="help-circle-outline" size={20} color="#fff" />
            <Text style={lStyles.quizBtnText}>Quize Başla</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const lStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.text.primary, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 8 },
  content: { fontSize: 15, color: colors.text.primary, lineHeight: 26 },
  footer: { padding: 16, paddingBottom: 24, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  quizBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.personal, borderRadius: 14, paddingVertical: 15,
  },
  quizBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ---- CoachScreen ----
export default function CoachScreen() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved) setCompleted(JSON.parse(saved));
    });
  }, []);

  const markComplete = async (lessonId: string) => {
    if (completed.includes(lessonId)) return;
    const next = [...completed, lessonId];
    setCompleted(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    try { await personalAPI.submitQuizResult({ lessonId, correct: true }); } catch {}
  };

  const level1Ids = CURRICULUM[0].topics.flatMap(t => t.lessons.map(l => l.id));
  const level2Ids = CURRICULUM[1].topics.flatMap(t => t.lessons.map(l => l.id));
  const level1Done = level1Ids.filter(id => completed.includes(id)).length;
  const level2Done = level2Ids.filter(id => completed.includes(id)).length;

  const isUnlocked = (level: 1 | 2 | 3) => {
    if (level === 1) return true;
    if (level === 2) return level1Done >= 6;
    return level2Done >= 6;
  };

  const handleAsk = async () => {
    const q = question.trim();
    if (!q) return;
    setAsking(true);
    setAnswer('');
    try {
      const res = await personalAPI.askCoach(q);
      setAnswer((res.data as any)?.answer || 'Cevap alınamadı.');
      setQuestion('');
    } catch {
      setAnswer('Bağlantı hatası oluştu.');
    } finally {
      setAsking(false);
    }
  };

  const totalDone = completed.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Genel ilerleme */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconWrap}>
              <Ionicons name="school" size={24} color={colors.personal} />
            </View>
            <View style={styles.progressInfo}>
              <Text style={styles.progressTitle}>FinansKoç</Text>
              <Text style={styles.progressSub}>{totalDone}/27 ders tamamlandı</Text>
            </View>
            <Text style={styles.progressPct}>{Math.round((totalDone / 27) * 100)}%</Text>
          </View>
          <ProgressBar current={totalDone} total={27} color={colors.personal} showLabel={false} height={8} />
        </View>

        {/* Seviyeler */}
        {CURRICULUM.map(lvl => {
          const lvlIds = lvl.topics.flatMap(t => t.lessons.map(l => l.id));
          const lvlDone = lvlIds.filter(id => completed.includes(id)).length;
          const unlocked = isUnlocked(lvl.level);

          return (
            <View key={lvl.level} style={styles.levelSection}>
              {/* Level başlık */}
              <View style={[styles.levelHeader, { borderLeftColor: lvl.color }]}>
                <View style={[styles.levelBadge, { backgroundColor: lvl.color }]}>
                  <Text style={styles.levelBadgeNum}>{lvl.level}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>{lvl.title}</Text>
                  <Text style={styles.levelSub}>{lvl.subtitle}</Text>
                </View>
                <View style={styles.levelProgress}>
                  <Text style={[styles.levelProgressText, { color: lvl.color }]}>{lvlDone}/9</Text>
                  {!unlocked && <Ionicons name="lock-closed" size={14} color={colors.text.muted} />}
                </View>
              </View>

              {!unlocked ? (
                <View style={styles.lockedBox}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.text.muted} />
                  <Text style={styles.lockedText}>
                    {lvl.level === 2
                      ? `Seviye 1'den en az 6 ders tamamla (${level1Done}/6)`
                      : `Seviye 2'den en az 6 ders tamamla (${level2Done}/6)`}
                  </Text>
                </View>
              ) : (
                lvl.topics.map(topic => {
                  const topicDone = topic.lessons.filter(l => completed.includes(l.id)).length;
                  const isExpanded = expandedTopic === topic.id;

                  return (
                    <View key={topic.id} style={styles.topicContainer}>
                      <TouchableOpacity
                        style={styles.topicRow}
                        onPress={() => setExpandedTopic(isExpanded ? null : topic.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.topicIconWrap, { backgroundColor: lvl.color + '18' }]}>
                          <Ionicons name={topic.icon as any} size={18} color={lvl.color} />
                        </View>
                        <Text style={styles.topicTitle}>{topic.title}</Text>
                        <Text style={[styles.topicCount, { color: lvl.color }]}>{topicDone}/3</Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.text.muted}
                        />
                      </TouchableOpacity>

                      {isExpanded && topic.lessons.map(lesson => {
                        const isDone = completed.includes(lesson.id);
                        return (
                          <TouchableOpacity
                            key={lesson.id}
                            style={styles.lessonRow}
                            onPress={() => setActiveLesson(lesson)}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                              size={20}
                              color={isDone ? '#10B981' : colors.text.muted}
                            />
                            <Text style={[styles.lessonTitle, isDone && styles.lessonDone]}>
                              {lesson.title}
                            </Text>
                            <View style={[styles.startBadge, { backgroundColor: lvl.color + '18' }]}>
                              <Text style={[styles.startBadgeText, { color: lvl.color }]}>
                                {isDone ? 'Tekrar' : 'Başla'}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </View>
          );
        })}

        {/* FinansKoç'a Sor */}
        <Text style={styles.sectionTitle}>FinansKoç'a Sor</Text>
        <View style={styles.askCard}>
          <TextInput
            style={styles.askInput}
            placeholder="Finansal sorunuzu yazın..."
            placeholderTextColor={colors.text.muted}
            value={question}
            onChangeText={setQuestion}
            multiline
            maxLength={300}
          />
          <TouchableOpacity
            style={[styles.sendBtn, asking && { opacity: 0.6 }]}
            onPress={handleAsk}
            disabled={asking}
          >
            {asking
              ? <ActivityIndicator size="small" color="#fff" />
              : <Ionicons name="send" size={18} color="#fff" />
            }
          </TouchableOpacity>
        </View>

        {answer ? (
          <View style={styles.answerCard}>
            <View style={styles.answerHeader}>
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.personal} />
              <Text style={styles.answerTitle}>FinansKoç</Text>
            </View>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      {activeLesson && (
        <LessonModal
          lesson={activeLesson}
          visible
          onClose={() => setActiveLesson(null)}
          onComplete={() => {
            markComplete(activeLesson.id);
            setActiveLesson(null);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 12 },

  progressCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  progressIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#EDE9FE', alignItems: 'center', justifyContent: 'center',
  },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  progressSub: { fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  progressPct: { fontSize: 18, fontWeight: '800', color: colors.personal },

  levelSection: {
    backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderLeftWidth: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  levelBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  levelBadgeNum: { fontSize: 16, fontWeight: '800', color: '#fff' },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  levelSub: { fontSize: 11, color: colors.text.muted, marginTop: 1 },
  levelProgress: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  levelProgressText: { fontSize: 13, fontWeight: '700' },

  lockedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, backgroundColor: colors.background,
  },
  lockedText: { flex: 1, fontSize: 13, color: colors.text.muted },

  topicContainer: { borderBottomWidth: 1, borderBottomColor: colors.border },
  topicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  topicIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  topicTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text.primary },
  topicCount: { fontSize: 13, fontWeight: '700' },

  lessonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 11,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  lessonTitle: { flex: 1, fontSize: 13, color: colors.text.primary },
  lessonDone: { color: colors.text.muted },
  startBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  startBadgeText: { fontSize: 11, fontWeight: '700' },

  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: colors.text.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4,
  },
  askCard: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: colors.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  askInput: {
    flex: 1, fontSize: 14, color: colors.text.primary,
    maxHeight: 100, paddingVertical: 4,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.personal, alignItems: 'center', justifyContent: 'center',
  },
  answerCard: {
    backgroundColor: '#EDE9FE', borderRadius: 14, padding: 14, gap: 8,
  },
  answerHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  answerTitle: { fontSize: 13, fontWeight: '700', color: colors.personal },
  answerText: { fontSize: 13, color: colors.text.primary, lineHeight: 21 },
});
