/**
 * Built-in Demo Dataset based on user requirements and real stream records
 */

import { SpotifyAccount } from '../types/spotify';
import { normalizeStreams, aggregateAccountData } from './parser';

// Sample raw streams extracted from user request for Primary User
const PRIMARY_USER_RAW_STREAMS = [
  { endTime: '2026-03-12 23:28', artistName: 'Million Dollar Quartet', trackName: "Honey Don't", msPlayed: 140240 },
  { endTime: '2026-03-12 23:34', artistName: 'Robert Schumann', trackName: 'Arabeske in C Major, Op. 18', msPlayed: 399000 },
  { endTime: '2026-03-12 23:38', artistName: 'Traveling Wilburys', trackName: 'Heading For The Light', msPlayed: 216693 },
  { endTime: '2026-03-12 23:46', artistName: 'Bessie Smith', trackName: 'At the Christmas Ball - 78rpm Version', msPlayed: 203640 },
  { endTime: '2026-03-12 23:50', artistName: 'Judas Priest', trackName: 'Better by You, Better Than Me - Live', msPlayed: 220867 },
  { endTime: '2026-03-13 00:01', artistName: 'Metallica', trackName: 'The Wait - Remastered', msPlayed: 77880 },
  { endTime: '2026-03-13 14:48', artistName: 'Led Zeppelin', trackName: 'When the Levee Breaks - Remaster', msPlayed: 415606 },
  { endTime: '2026-03-13 14:58', artistName: 'The Who', trackName: 'Overture', msPlayed: 320032 },
  { endTime: '2026-03-13 15:03', artistName: 'Rainbow', trackName: 'Man On The Silver Mountain', msPlayed: 277227 },
  { endTime: '2026-03-13 16:11', artistName: 'Led Zeppelin', trackName: 'Kashmir - Remaster', msPlayed: 517125 },
  { endTime: '2026-03-13 16:14', artistName: 'ZZ Top', trackName: 'La Grange (2005 Remaster)', msPlayed: 230480 },
  { endTime: '2026-03-13 16:34', artistName: 'Deep Purple', trackName: 'Stormbringer - 2009 Digital Remaster', msPlayed: 184145 },
  { endTime: '2026-03-13 17:12', artistName: 'Queen', trackName: 'Death On Two Legs (Dedicated To...) - Remastered 2011', msPlayed: 223920 },
  { endTime: '2026-03-13 17:23', artistName: "Guns N' Roses", trackName: 'My Michelle', msPlayed: 219933 },
  { endTime: '2026-03-14 11:45', artistName: 'Pink Floyd', trackName: 'Wish You Were Here', msPlayed: 336473 },
  { endTime: '2026-03-14 11:59', artistName: 'Pink Floyd', trackName: 'Shine On You Crazy Diamond (Pts. 6-9)', msPlayed: 743760 },
  { endTime: '2026-03-14 12:05', artistName: 'U2', trackName: 'With Or Without You - 2005 Live From Milan', msPlayed: 386027 },
  { endTime: '2026-03-14 12:13', artistName: 'Black Sabbath', trackName: 'War Pigs - Live', msPlayed: 463742 },
  { endTime: '2026-03-14 12:50', artistName: 'Led Zeppelin', trackName: 'Stairway to Heaven - Live 1972; Remaster', msPlayed: 577013 },
  { endTime: '2026-03-14 13:14', artistName: 'AC/DC', trackName: 'Thunderstruck', msPlayed: 292334 },
  { endTime: '2026-03-15 03:07', artistName: 'Eric Clapton', trackName: 'Since You Said Goodbye', msPlayed: 180840 },
  { endTime: '2026-03-15 03:19', artistName: 'Eric Clapton', trackName: 'Before You Accuse Me - Acoustic Live', msPlayed: 214616 },
  { endTime: '2026-03-15 03:23', artistName: 'Eric Clapton', trackName: 'Hey Hey - Acoustic Live', msPlayed: 200694 },
  { endTime: '2026-03-15 03:34', artistName: 'Eric Clapton', trackName: 'Layla - Acoustic Live', msPlayed: 289027 },
  { endTime: '2026-03-15 03:38', artistName: 'Eric Clapton', trackName: 'Running on Faith - Acoustic Live', msPlayed: 259015 },
  { endTime: '2026-03-17 10:35', artistName: 'Mark Knopfler', trackName: 'What It Is', msPlayed: 289361 },
  { endTime: '2026-03-17 15:16', artistName: 'David Gilmour', trackName: 'Murder', msPlayed: 299787 },
  { endTime: '2026-03-17 17:13', artistName: 'Dire Straits', trackName: "Where Do You Think You're Going?", msPlayed: 229640 },
  { endTime: '2026-03-17 17:18', artistName: 'Mark Knopfler', trackName: "The Trawlerman's Song", msPlayed: 300640 },
  { endTime: '2026-03-17 20:52', artistName: 'Pink Floyd', trackName: 'Lost for Words', msPlayed: 314667 },
  { endTime: '2026-03-17 21:03', artistName: 'Mark Knopfler', trackName: 'Sailing To Philadelphia', msPlayed: 353120 },
  { endTime: '2026-03-17 21:07', artistName: 'Dire Straits', trackName: "The Man's Too Strong - Remastered 1996", msPlayed: 278707 },
  { endTime: '2026-03-17 22:30', artistName: 'Mark Knopfler', trackName: 'Beryl', msPlayed: 190920 },
  { endTime: '2026-03-18 21:12', artistName: 'Dream Theater', trackName: 'Pull Me Under', msPlayed: 493933 },
  { endTime: '2026-03-18 21:18', artistName: 'Supertramp', trackName: 'Crime Of The Century - Remastered 2010', msPlayed: 332992 },
  { endTime: '2026-03-18 21:22', artistName: 'Pink Floyd', trackName: 'In the Flesh', msPlayed: 255907 },
  { endTime: '2026-03-18 21:26', artistName: 'Genesis', trackName: 'I Know What I Like (In Your Wardrobe) - 2007 Stereo Mix', msPlayed: 250400 },
  { endTime: '2026-03-18 21:46', artistName: 'Genesis', trackName: 'Firth of Fifth - 2007 Stereo Mix', msPlayed: 570987 },
  { endTime: '2026-03-18 22:07', artistName: 'Rush', trackName: 'La Villa Strangiato', msPlayed: 554025 },
  { endTime: '2026-03-19 11:50', artistName: 'Roger Waters', trackName: 'Amused to Death', msPlayed: 546787 },
  { endTime: '2026-03-20 22:58', artistName: 'Bob Marley & The Wailers', trackName: 'Could You Be Loved', msPlayed: 237000 },
  { endTime: '2026-03-20 23:01', artistName: 'Bob Marley & The Wailers', trackName: 'Three Little Birds', msPlayed: 180267 },
  { endTime: '2026-03-20 23:05', artistName: 'Bob Marley & The Wailers', trackName: 'Is This Love', msPlayed: 232200 },
  { endTime: '2026-03-21 13:18', artistName: 'Bob Marley & The Wailers', trackName: 'Redemption Song', msPlayed: 233560 },
  { endTime: '2026-03-21 14:19', artistName: 'Bob Marley & The Wailers', trackName: 'Exodus', msPlayed: 458587 },
  { endTime: '2026-03-27 22:06', artistName: 'Dire Straits', trackName: 'Money For Nothing - Edit', msPlayed: 246840 },
  { endTime: '2026-03-27 22:28', artistName: 'Dire Straits', trackName: 'Telegraph Road', msPlayed: 858133 },
  { endTime: '2026-03-27 22:59', artistName: 'Dire Straits', trackName: 'Sultans Of Swing', msPlayed: 348400 },
  { endTime: '2026-03-27 23:20', artistName: 'Dire Straits', trackName: 'Brothers In Arms - Remastered 1996', msPlayed: 420240 },
  { endTime: '2026-04-03 12:02', artistName: 'Tim Maia', trackName: 'Não Quero Dinheiro (Só Quero Amar)', msPlayed: 153791 },
  { endTime: '2026-04-03 12:05', artistName: 'Legião Urbana', trackName: 'O Mundo Anda Tão Complicado', msPlayed: 226267 },
  { endTime: '2026-04-03 12:13', artistName: 'Os Paralamas Do Sucesso', trackName: 'Lanterna Dos Afogados', msPlayed: 189533 },
  { endTime: '2026-04-03 12:34', artistName: 'Os Paralamas Do Sucesso', trackName: 'Meu Erro', msPlayed: 208626 },
  { endTime: '2026-04-07 16:00', artistName: 'Angine de Poitrine', trackName: 'Sherpa', msPlayed: 343190 },
  { endTime: '2026-04-07 16:07', artistName: 'Angine de Poitrine', trackName: 'Fabienk', msPlayed: 390204 },
  { endTime: '2026-04-07 16:13', artistName: 'Angine de Poitrine', trackName: 'Mata Zyklek', msPlayed: 369864 },
  { endTime: '2026-04-07 16:29', artistName: 'Angine de Poitrine', trackName: 'Tamebsz', msPlayed: 476654 },
  { endTime: '2026-04-07 16:56', artistName: 'Angine de Poitrine', trackName: 'Utzp', msPlayed: 409656 },
  { endTime: '2026-04-07 17:02', artistName: 'Angine de Poitrine', trackName: 'Yor Zarad', msPlayed: 388531 },
  { endTime: '2026-04-07 17:11', artistName: 'Angine de Poitrine', trackName: 'Angor', msPlayed: 376755 },
  { endTime: '2026-04-11 03:09', artistName: 'Bob Dylan', trackName: 'I Contain Multitudes', msPlayed: 275699 },
  { endTime: '2026-04-11 04:28', artistName: 'Bob Dylan', trackName: 'Murder Most Foul', msPlayed: 872420 },
  { endTime: '2026-04-16 22:49', artistName: 'Nightwish', trackName: 'Alpenglow - Instrumental', msPlayed: 288052 },
  { endTime: '2026-04-16 23:36', artistName: 'Nightwish', trackName: 'The Greatest Show on Earth - Instrumental', msPlayed: 2132209 },
  { endTime: '2026-04-20 12:42', artistName: 'Chico Buarque', trackName: 'Construção', msPlayed: 383627 },
  { endTime: '2026-04-20 13:05', artistName: 'Chico Buarque', trackName: 'Cálice', msPlayed: 241867 },
  { endTime: '2026-04-20 13:50', artistName: 'Chico Buarque', trackName: 'Apesar De Você', msPlayed: 235547 },
  { endTime: '2026-04-20 14:12', artistName: 'Cartola', trackName: 'O Mundo É Um Moinho', msPlayed: 233520 },
  { endTime: '2026-04-20 14:35', artistName: 'Cartola', trackName: 'Preciso Me Encontrar', msPlayed: 178507 },
  { endTime: '2026-04-20 15:19', artistName: 'Belchior', trackName: 'Apenas Um Rapaz Latino Americano', msPlayed: 258027 },
  { endTime: '2026-04-20 16:20', artistName: 'Elis Regina', trackName: 'Como Nossos Pais', msPlayed: 261600 },
  { endTime: '2026-05-30 22:32', artistName: 'Zé Ramalho', trackName: 'Avôhai', msPlayed: 297520 },
  { endTime: '2026-05-30 22:40', artistName: 'Zé Ramalho', trackName: 'Vila do Sossego', msPlayed: 233280 },
  { endTime: '2026-05-30 22:45', artistName: 'Zé Ramalho', trackName: 'Chão de Giz', msPlayed: 285360 },
  { endTime: '2026-06-01 12:01', artistName: 'Slayer', trackName: 'Raining Blood', msPlayed: 207156 },
  { endTime: '2026-06-01 12:26', artistName: 'Slayer', trackName: 'War Ensemble', msPlayed: 291733 },
  { endTime: '2026-06-10 19:16', artistName: 'Rush', trackName: 'Subdivisions', msPlayed: 334000 },
  { endTime: '2026-06-10 19:21', artistName: 'Rush', trackName: 'Freewill', msPlayed: 321800 },
  { endTime: '2026-06-10 21:06', artistName: 'Rush', trackName: 'YYZ', msPlayed: 265840 },
  { endTime: '2026-06-10 21:17', artistName: 'Rush', trackName: 'Tom Sawyer', msPlayed: 276880 },
  { endTime: '2026-07-02 08:59', artistName: 'Pink Floyd', trackName: 'Time - Live from the Los Angeles Sports Arena, 1975', msPlayed: 390667 },
  { endTime: '2026-07-02 09:14', artistName: 'Pink Floyd', trackName: 'Money - Live from the Los Angeles Sports Arena, 1975', msPlayed: 487427 },
  { endTime: '2026-07-02 09:22', artistName: 'Pink Floyd', trackName: 'Us and Them - Live from the Los Angeles Sports Arena, 1975', msPlayed: 473307 },
  { endTime: '2026-07-02 09:59', artistName: 'Pink Floyd', trackName: 'Echoes - Live from the Los Angeles Sports Arena, 1975', msPlayed: 1346133 },
  { endTime: '2026-07-11 18:26', artistName: 'Radiohead', trackName: 'Creep', msPlayed: 238640 },
  { endTime: '2026-07-11 22:04', artistName: 'Nirvana', trackName: 'Smells Like Teen Spirit', msPlayed: 301920 },
  { endTime: '2026-07-12 18:10', artistName: 'Oasis', trackName: 'Wonderwall - Remastered', msPlayed: 254924 },
  { endTime: '2026-07-12 18:23', artistName: 'The Who', trackName: "Baba O'Riley", msPlayed: 300400 },
  { endTime: '2026-07-31 19:56', artistName: 'Robert Johnson', trackName: 'Sweet Home Chicago', msPlayed: 176627 },
  { endTime: '2026-07-31 19:59', artistName: 'John Lee Hooker', trackName: 'One Bourbon, One Scotch, One Beer', msPlayed: 184960 },
  { endTime: '2026-07-31 20:02', artistName: 'T-Bone Walker', trackName: 'T-Bone Shuffle', msPlayed: 170000 },
  { endTime: '2026-07-31 20:05', artistName: 'Sonny Boy Williamson II', trackName: 'Help Me', msPlayed: 188200 },
  { endTime: '2026-08-01 01:49', artistName: 'Elmore James', trackName: 'The Sky Is Crying', msPlayed: 166400 },
  { endTime: '2026-08-01 01:51', artistName: 'Albert King', trackName: 'Born Under A Bad Sign - Mono Mix', msPlayed: 169998 },
  { endTime: '2026-08-02 10:10', artistName: 'Muddy Waters', trackName: "I'm Your Hoochie Coochie Man", msPlayed: 238533 },
  { endTime: '2026-08-02 10:22', artistName: 'Etta James', trackName: "I'd Rather Go Blind", msPlayed: 156653 },
  { endTime: '2026-08-02 10:35', artistName: 'Muddy Waters', trackName: 'Mannish Boy', msPlayed: 321133 },
  { endTime: '2026-08-02 10:54', artistName: 'Robert Johnson', trackName: 'Cross Road Blues', msPlayed: 149560 },
  { endTime: '2026-08-02 10:57', artistName: 'John Lee Hooker', trackName: 'Boom Boom', msPlayed: 160560 },
];

// Sample streams for Kids 1 (Arthur B Soethe)
const KIDS_1_RAW_STREAMS = [
  { endTime: '2026-05-16 11:27', artistName: 'Engenheiros Do Hawaii', trackName: 'Toda Forma de Poder', msPlayed: 191722 },
  { endTime: '2026-05-16 11:31', artistName: 'Engenheiros Do Hawaii', trackName: 'Era um Garoto, Que Como Eu, Amava os Beatles e os Rolling Stones', msPlayed: 264704 },
  { endTime: '2026-05-16 11:34', artistName: 'Engenheiros Do Hawaii', trackName: 'A Revolta Dos Dandis Part I', msPlayed: 179425 },
  { endTime: '2026-05-16 11:47', artistName: 'Engenheiros Do Hawaii', trackName: 'Infinita Highway', msPlayed: 370495 },
  { endTime: '2026-05-16 11:51', artistName: 'Engenheiros Do Hawaii', trackName: 'O Papa é Pop', msPlayed: 226244 },
  { endTime: '2026-05-16 11:58', artistName: 'Engenheiros Do Hawaii', trackName: 'Terra de Gigantes', msPlayed: 237675 },
  { endTime: '2026-05-16 13:06', artistName: 'The Rolling Stones', trackName: 'Brown Sugar - Remastered 2009', msPlayed: 228667 },
  { endTime: '2026-05-16 13:09', artistName: 'Van Halen', trackName: "Runnin' with the Devil - 2015 Remaster", msPlayed: 214960 },
  { endTime: '2026-05-16 13:17', artistName: 'Pink Floyd', trackName: 'Us and Them', msPlayed: 472627 },
  { endTime: '2026-05-16 15:02', artistName: 'Sex Pistols', trackName: 'God Save The Queen', msPlayed: 199453 },
  { endTime: '2026-05-16 15:37', artistName: 'AC/DC', trackName: 'Thunderstruck', msPlayed: 292334 },
  { endTime: '2026-05-16 15:55', artistName: 'ZZ Top', trackName: 'Sharp Dressed Man (2008 Remaster)', msPlayed: 204952 },
  { endTime: '2026-05-16 18:13', artistName: 'Ramones', trackName: 'Blitzkrieg Bop - 2016 Remaster', msPlayed: 134467 },
  { endTime: '2026-05-16 18:23', artistName: "Guns N' Roses", trackName: 'Patience', msPlayed: 354880 },
  { endTime: '2026-05-16 20:00', artistName: 'Ozzy Osbourne', trackName: 'Crazy Train', msPlayed: 293183 },
  { endTime: '2026-05-30 01:01', artistName: 'Pharrell Williams', trackName: 'Happy - From "Despicable Me 2"', msPlayed: 233307 },
  { endTime: '2026-05-30 01:05', artistName: 'Elvis Presley', trackName: 'A Little Less Conversation - JXL Radio Edit Remix', msPlayed: 211507 },
  { endTime: '2026-05-30 01:11', artistName: 'Daft Punk', trackName: 'Get Lucky (feat. Pharrell Williams and Nile Rodgers)', msPlayed: 369615 },
  { endTime: '2026-05-30 01:18', artistName: 'Elton John', trackName: "I'm Still Standing", msPlayed: 183440 },
  { endTime: '2026-07-10 23:41', artistName: 'Mamonas Assassinas', trackName: 'Pelados Em Santos', msPlayed: 202600 },
  { endTime: '2026-07-10 23:44', artistName: 'Mamonas Assassinas', trackName: 'Chopis Centis', msPlayed: 166998 },
  { endTime: '2026-07-10 23:47', artistName: 'Mamonas Assassinas', trackName: 'Jumento Celestino', msPlayed: 157867 },
  { endTime: '2026-07-10 23:50', artistName: 'Mamonas Assassinas', trackName: 'Lá Vem O Alemão', msPlayed: 203800 },
  { endTime: '2026-07-10 23:54', artistName: 'Mamonas Assassinas', trackName: 'Uma Arlinda Mulher', msPlayed: 199267 },
  { endTime: '2026-07-10 23:58', artistName: 'Mamonas Assassinas', trackName: 'Mundo Animal', msPlayed: 236560 },
  { endTime: '2026-07-10 23:59', artistName: 'Mamonas Assassinas', trackName: 'Vira-Vira', msPlayed: 149000 },
  { endTime: '2026-07-11 00:01', artistName: 'Mamonas Assassinas', trackName: 'Robocop Gay', msPlayed: 215860 },
  { endTime: '2026-07-11 00:02', artistName: 'Mamonas Assassinas', trackName: 'Sabão Cra-Cra (The Mad Ku-Ku)', msPlayed: 42467 },
  { endTime: '2026-07-12 17:24', artistName: 'Green Day', trackName: 'Basket Case', msPlayed: 181533 },
  { endTime: '2026-07-12 23:57', artistName: 'Green Day', trackName: 'Boulevard of Broken Dreams', msPlayed: 262067 },
];

// Sample streams for Kids 3 (Alice B Soethe)
const KIDS_3_RAW_STREAMS = [
  { endTime: '2026-03-17 21:35', artistName: 'BABYMONSTER', trackName: 'PSYCHO', msPlayed: 195410 },
  { endTime: '2026-03-17 22:06', artistName: 'BABYMONSTER', trackName: 'WE GO UP', msPlayed: 186973 },
  { endTime: '2026-03-29 20:08', artistName: 'BLACKPINK', trackName: 'JUMP', msPlayed: 164718 },
  { endTime: '2026-03-29 20:08', artistName: 'Jung Kook', trackName: 'Standing Next to You', msPlayed: 206000 },
  { endTime: '2026-03-29 20:08', artistName: 'FIFTY FIFTY', trackName: 'Cupid – Twin Ver. (feat. Sabrina Carpenter)', msPlayed: 174000 },
  { endTime: '2026-03-29 20:13', artistName: 'KATSEYE', trackName: 'Touch', msPlayed: 154000 },
  { endTime: '2026-04-11 20:27', artistName: 'BABYMONSTER', trackName: 'DRIP', msPlayed: 180846 },
  { endTime: '2026-04-11 20:33', artistName: 'BABYMONSTER', trackName: 'PSYCHO', msPlayed: 195410 },
  { endTime: '2026-04-12 20:54', artistName: 'BABYMONSTER', trackName: 'DRIP', msPlayed: 180846 },
  { endTime: '2026-04-12 20:57', artistName: 'LE SSERAFIM', trackName: 'SPAGHETTI', msPlayed: 158894 },
  { endTime: '2026-04-12 21:01', artistName: 'BABYMONSTER', trackName: 'PSYCHO', msPlayed: 195410 },
  { endTime: '2026-04-12 21:48', artistName: 'BABYMONSTER', trackName: 'SHEESH', msPlayed: 172000 },
  { endTime: '2026-05-01 20:11', artistName: 'The Weeknd', trackName: 'Blinding Lights', msPlayed: 200040 },
  { endTime: '2026-05-01 23:13', artistName: 'Michael Jackson', trackName: "Wanna Be Startin' Somethin'", msPlayed: 363272 },
  { endTime: '2026-05-01 23:20', artistName: 'Michael Jackson', trackName: 'The Way You Make Me Feel - 2012 Remaster', msPlayed: 297252 },
  { endTime: '2026-05-01 23:30', artistName: 'Michael Jackson', trackName: "Don't Stop 'Til You Get Enough", msPlayed: 364442 },
  { endTime: '2026-05-01 23:51', artistName: 'Michael Jackson', trackName: 'Bad', msPlayed: 247000 },
  { endTime: '2026-05-02 00:32', artistName: 'Michael Jackson', trackName: "They Don't Care About Us", msPlayed: 261669 },
  { endTime: '2026-05-02 00:35', artistName: 'BABYMONSTER', trackName: 'WE GO UP', msPlayed: 186973 },
  { endTime: '2026-05-02 00:36', artistName: 'Michael Jackson', trackName: 'Billie Jean', msPlayed: 293827 },
  { endTime: '2026-05-02 00:36', artistName: 'Michael Jackson', trackName: 'Thriller', msPlayed: 358807 },
  { endTime: '2026-05-05 21:10', artistName: 'PSY', trackName: 'Gangnam Style (강남스타일)', msPlayed: 219000 },
  { endTime: '2026-05-05 21:13', artistName: 'Wonder Girls', trackName: 'Tell Me', msPlayed: 170410 },
  { endTime: '2026-05-05 21:17', artistName: 'NewJeans', trackName: 'Right Now', msPlayed: 160413 },
  { endTime: '2026-05-05 21:20', artistName: 'NewJeans', trackName: 'Supernatural', msPlayed: 191000 },
  { endTime: '2026-05-05 21:24', artistName: 'NewJeans', trackName: 'How Sweet', msPlayed: 219026 },
  { endTime: '2026-05-05 21:27', artistName: 'NewJeans', trackName: 'Bubble Gum', msPlayed: 200267 },
  { endTime: '2026-05-15 22:02', artistName: 'aespa', trackName: 'Supernova', msPlayed: 178880 },
  { endTime: '2026-05-16 13:56', artistName: 'KATSEYE', trackName: 'Gnarly', msPlayed: 111402 },
  { endTime: '2026-05-24 19:20', artistName: 'aespa', trackName: 'Rich Man', msPlayed: 197578 },
  { endTime: '2026-05-25 20:42', artistName: 'LE SSERAFIM', trackName: 'CELEBRATION', msPlayed: 153000 },
  { endTime: '2026-05-25 20:45', artistName: 'LE SSERAFIM', trackName: 'SPAGHETTI', msPlayed: 172314 },
  { endTime: '2026-05-25 20:48', artistName: 'LE SSERAFIM', trackName: 'HOT', msPlayed: 143798 },
  { endTime: '2026-05-25 20:50', artistName: 'LE SSERAFIM', trackName: 'Come Over', msPlayed: 137178 },
  { endTime: '2026-05-25 20:53', artistName: 'LE SSERAFIM', trackName: 'CRAZY', msPlayed: 135773 },
  { endTime: '2026-05-25 20:56', artistName: 'LE SSERAFIM', trackName: 'Smart', msPlayed: 166384 },
  { endTime: '2026-05-25 20:58', artistName: 'LE SSERAFIM', trackName: 'EASY', msPlayed: 155799 },
  { endTime: '2026-05-25 21:01', artistName: 'LE SSERAFIM', trackName: 'Perfect Night', msPlayed: 159080 },
  { endTime: '2026-06-08 16:48', artistName: 'aespa', trackName: 'Drama', msPlayed: 214973 },
  { endTime: '2026-06-08 16:51', artistName: 'aespa', trackName: 'Supernova', msPlayed: 178880 },
  { endTime: '2026-06-08 16:54', artistName: 'aespa', trackName: 'Armageddon', msPlayed: 196467 },
  { endTime: '2026-06-08 18:01', artistName: 'aespa', trackName: 'Dirty Work', msPlayed: 180250 },
  { endTime: '2026-06-08 18:15', artistName: 'aespa', trackName: 'LEMONADE (feat. Becky G)', msPlayed: 134888 },
  { endTime: '2026-06-27 21:26', artistName: 'aespa', trackName: 'LEMONADE', msPlayed: 187000 },
  { endTime: '2026-06-27 22:45', artistName: 'Coldplay', trackName: 'Paradise', msPlayed: 232641 },
  { endTime: '2026-06-27 22:54', artistName: 'Coldplay', trackName: 'Fix You', msPlayed: 295533 },
  { endTime: '2026-06-27 22:58', artistName: 'Coldplay', trackName: 'Yellow', msPlayed: 266773 },
  { endTime: '2026-07-08 23:10', artistName: 'Olivia Rodrigo', trackName: 'the cure', msPlayed: 297090 },
  { endTime: '2026-07-08 23:13', artistName: 'BABYMONSTER', trackName: 'CHOOM', msPlayed: 178880 },
  { endTime: '2026-07-08 23:16', artistName: 'BABYMONSTER', trackName: 'SUGAR HONEY ICE TEA', msPlayed: 178033 },
  { endTime: '2026-07-09 22:45', artistName: 'Olivia Rodrigo', trackName: 'what’s wrong with me', msPlayed: 224906 },
  { endTime: '2026-07-10 22:54', artistName: 'Olivia Rodrigo', trackName: 'drop dead', msPlayed: 224999 },
];

/**
 * Returns a complete set of accounts matching the 4 index.txt accounts:
 * 1. Spotify Account Data you
 * 2. Spotify Kids Account Data_1 Arthur B Soethe
 * 3. Spotify Kids Account Data_2 Arthur B. Soethe (NO STREAMING HISTORY)
 * 4. Spotify Kids Account Data_3 Alice B Soethe
 */
export function getDemoAccounts(): SpotifyAccount[] {
  // Account 1: Primary
  const normStreamsPrimary = normalizeStreams(PRIMARY_USER_RAW_STREAMS);
  const accountPrimary = aggregateAccountData(
    'acc_demo_primary',
    'Spotify Account Data you',
    'Usuário Principal (Pedro)',
    'primary',
    normStreamsPrimary,
    {
      userData: {
        username: 'pedro_spotify',
        email: 'pedro@example.com',
        country: 'BR',
        birthdate: '1988-04-12',
        gender: 'male',
        creationTime: '2015-08-20',
      },
      playlists: [
        {
          name: 'Prog Rock & Psychedelic Classics',
          lastModifiedDate: '2026-08-01',
          numberOfFollowers: 14,
          description: 'Pink Floyd, Genesis, King Crimson, Rush, Supertramp e clássicos atemporais.',
          items: [
            { trackName: 'Wish You Were Here', artistName: 'Pink Floyd', albumName: 'Wish You Were Here' },
            { trackName: 'Firth of Fifth', artistName: 'Genesis', albumName: 'Selling England By The Pound' },
            { trackName: 'Xanadu', artistName: 'Rush', albumName: 'A Farewell to Kings' },
            { trackName: 'Crime Of The Century', artistName: 'Supertramp', albumName: 'Crime of the Century' },
          ],
        },
        {
          name: 'Blues & Rock Standards',
          lastModifiedDate: '2026-07-28',
          numberOfFollowers: 6,
          description: 'Acoustic blues, delta blues e lendas da guitarra.',
          items: [
            { trackName: 'Sweet Home Chicago', artistName: 'Robert Johnson', albumName: 'King of the Delta Blues Singers' },
            { trackName: 'Layla - Acoustic Live', artistName: 'Eric Clapton', albumName: 'Unplugged' },
            { trackName: 'Boom Boom', artistName: 'John Lee Hooker', albumName: 'Burnin' },
          ],
        },
        {
          name: 'MPB e Samba de Raiz',
          lastModifiedDate: '2026-07-15',
          numberOfFollowers: 9,
          description: 'Clássicos da música brasileira.',
          items: [
            { trackName: 'Construção', artistName: 'Chico Buarque', albumName: 'Construção' },
            { trackName: 'O Mundo É Um Moinho', artistName: 'Cartola', albumName: 'Cartola 1976' },
            { trackName: 'Como Nossos Pais', artistName: 'Elis Regina', albumName: 'Falso Brilhante' },
          ],
        },
      ],
      library: {
        tracks: [
          { artist: 'Pink Floyd', track: 'Dogs', album: 'Animals' },
          { artist: 'Mark Knopfler', track: 'What It Is', album: 'Sailing to Philadelphia' },
          { artist: 'Rush', track: 'Tom Sawyer', album: 'Moving Pictures' },
          { artist: 'Dire Straits', track: 'Sultans Of Swing', album: 'Dire Straits' },
        ],
        albums: [
          { artist: 'Pink Floyd', album: 'Wish You Were Here' },
          { artist: 'Led Zeppelin', album: 'Led Zeppelin IV' },
          { artist: 'Rush', album: 'Moving Pictures' },
        ],
        artists: [
          { name: 'Pink Floyd' },
          { name: 'Mark Knopfler' },
          { name: 'Dire Straits' },
          { name: 'Rush' },
          { name: 'Eric Clapton' },
          { name: 'Bob Dylan' },
          { name: 'Angine de Poitrine' },
        ],
      },
      searchQueries: [
        { date: '2026-08-10', searchTime: '21:10', platform: 'Windows', searchQuery: 'Pink Floyd Live at Pompeii' },
        { date: '2026-08-08', searchTime: '19:40', platform: 'Android', searchQuery: 'T-Bone Walker Stormy Monday' },
        { date: '2026-08-01', searchTime: '22:15', platform: 'Windows', searchQuery: 'Metallica Orion Master of Puppets' },
        { date: '2026-07-20', searchTime: '14:30', platform: 'Android', searchQuery: 'Angine de Poitrine' },
        { date: '2026-07-05', searchTime: '18:20', platform: 'Windows', searchQuery: 'Zé Ramalho voz e violão' },
      ],
      inferences: [
        'Classic Rock & Progressive Enthusiast',
        'Delta Blues & Guitar Virtuosos',
        'Brazilian MPB & Tropicália',
        'Audiophile High Fidelity Listening',
      ],
    }
  );

  // Account 2: Kids 1 (Arthur B Soethe)
  const normStreamsKids1 = normalizeStreams(KIDS_1_RAW_STREAMS);
  const accountKids1 = aggregateAccountData(
    'acc_demo_kids1',
    'Spotify Kids Account Data_1 Arthur B Soethe',
    'Arthur B Soethe',
    'kids',
    normStreamsKids1,
    {
      userData: {
        username: 'arthur_b_soethe',
        creationTime: '2022-03-10',
      },
      playlists: [
        {
          name: 'Rock do Arthur & Mamonas',
          lastModifiedDate: '2026-07-12',
          numberOfFollowers: 2,
          items: [
            { trackName: 'Pelados Em Santos', artistName: 'Mamonas Assassinas', albumName: 'Mamonas Assassinas' },
            { trackName: 'Infinita Highway', artistName: 'Engenheiros Do Hawaii', albumName: 'Longe Demais das Capitais' },
            { trackName: 'Thunderstruck', artistName: 'AC/DC', albumName: 'The Razors Edge' },
          ],
        },
      ],
      library: {
        artists: [{ name: 'Engenheiros Do Hawaii' }, { name: 'Mamonas Assassinas' }, { name: 'Green Day' }],
      },
      searchQueries: [
        { date: '2026-07-10', searchTime: '23:35', platform: 'Android (Kids)', searchQuery: 'Mamonas Assassinas' },
        { date: '2026-05-16', searchTime: '11:20', platform: 'Android (Kids)', searchQuery: 'Engenheiros do Hawaii' },
      ],
    }
  );

  // Account 3: Kids 2 (Arthur B. Soethe) - EMPTY (Rule B: Treatment of accounts with no history)
  const accountKids2 = aggregateAccountData(
    'acc_demo_kids2',
    'Spotify Kids Account Data_2 Arthur B. Soethe',
    'Arthur B. Soethe (Conta Secundária)',
    'kids',
    [],
    {
      userData: {
        username: 'arthur_secondary',
        creationTime: '2024-01-15',
        country: 'BR',
      },
      playlists: [
        {
          name: 'Playlist Vazia / Sem Streams',
          lastModifiedDate: '2024-01-20',
          numberOfFollowers: 0,
          items: [],
        },
      ],
    }
  );

  // Account 4: Kids 3 (Alice B Soethe)
  const normStreamsKids3 = normalizeStreams(KIDS_3_RAW_STREAMS);
  const accountKids3 = aggregateAccountData(
    'acc_demo_kids3',
    'Spotify Kids Account Data_3 Alice B Soethe',
    'Alice B Soethe',
    'kids',
    normStreamsKids3,
    {
      userData: {
        username: 'alice_b_soethe',
        creationTime: '2023-06-01',
      },
      playlists: [
        {
          name: 'K-Pop & Pop Favorites (Alice)',
          lastModifiedDate: '2026-07-15',
          numberOfFollowers: 5,
          items: [
            { trackName: 'Supernova', artistName: 'aespa', albumName: 'Armageddon' },
            { trackName: 'PSYCHO', artistName: 'BABYMONSTER', albumName: 'BABYMONS7ER' },
            { trackName: 'SPAGHETTI', artistName: 'LE SSERAFIM', albumName: 'CRAZY' },
            { trackName: 'the cure', artistName: 'Olivia Rodrigo', albumName: 'GUTS' },
          ],
        },
      ],
      library: {
        artists: [{ name: 'BABYMONSTER' }, { name: 'aespa' }, { name: 'LE SSERAFIM' }, { name: 'Olivia Rodrigo' }, { name: 'Michael Jackson' }],
      },
      searchQueries: [
        { date: '2026-07-08', searchTime: '23:05', platform: 'iPad', searchQuery: 'BABYMONSTER' },
        { date: '2026-06-08', searchTime: '16:40', platform: 'iPad', searchQuery: 'aespa supernova' },
        { date: '2026-05-25', searchTime: '20:30', platform: 'iPad', searchQuery: 'LE SSERAFIM crazy' },
      ],
    }
  );

  return [accountPrimary, accountKids1, accountKids2, accountKids3];
}
