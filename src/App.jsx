import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Link,
  Icon,
  HStack,
  useColorModeValue,
  Card,
  CardBody,
  Select,
  SimpleGrid,
  Image,
  IconButton,
  useColorMode,
  Badge,
  Button,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Grid,
  Circle,
  Flex
} from '@chakra-ui/react';
import { SunIcon, MoonIcon, BellIcon, CalendarIcon, TimeIcon } from '@chakra-ui/icons';
import { FaGithub, FaTwitter } from 'react-icons/fa';
import { keyframes } from '@emotion/react';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { playNotificationSound } from '../public/notification-sound';

// Animasi custom
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const glowAnimation = keyframes`
  0% { filter: drop-shadow(0 0 2px rgba(72, 187, 120, 0.2)); }
  50% { filter: drop-shadow(0 0 10px rgba(72, 187, 120, 0.4)); }
  100% { filter: drop-shadow(0 0 2px rgba(72, 187, 120, 0.2)); }
`;

// Set locale dayjs ke Indonesia
dayjs.locale('id');

function App() {
  // State hooks
  const [dataJadwal, setDataJadwal] = useState([]);
  const [kotaTerpilih, setKotaTerpilih] = useState('');
  const [daftarKota, setDaftarKota] = useState([]);
  const [nextPrayer, setNextPrayer] = useState({ name: '', time: '' });
  const [countdown, setCountdown] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [prayerCountdowns, setPrayerCountdowns] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const savedState = localStorage.getItem('notificationsEnabled');
    return savedState ? JSON.parse(savedState) : false;
  });

  // Context hooks
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  // Theme color hooks
  const warnaBg = useColorModeValue('gray.50', 'gray.900');
  const warnaKartu = useColorModeValue('white', 'gray.800');
  const warnaBorder = useColorModeValue('green.100', 'green.700');
  const warnaTeks = useColorModeValue('gray.800', 'white');
  const warnaTeksSubtle = useColorModeValue('gray.600', 'gray.400');
  const warnaGradient = useColorModeValue(
    'linear(to-r, green.400, teal.500)',
    'linear(to-r, green.200, teal.300)'
  );
  const warnaBoxBg = useColorModeValue('green.50', 'gray.700');
  const warnaSelectBg = useColorModeValue('green.50', 'gray.700');
  const warnaSelectHover = useColorModeValue('green.100', 'gray.600');
  const flexBgColor = useColorModeValue('white', 'gray.700');
  const circleBorderColor = useColorModeValue('green.500', 'green.200');
  const clockHandleColor = useColorModeValue('green.500', 'green.200');
  const modalBoxBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    const ambilData = async () => {
      const response = await fetch('/jadwal-imsakiyah.csv');
      const teksCSV = await response.text();
      const hasil = Papa.parse(teksCSV, { 
        header: true,
        delimiter: ';',
        transform: (value) => value.trim(),
        transformHeader: (header) => header.toLowerCase().trim(),
      });
      setDataJadwal(hasil.data);
      const kotaUnik = [...new Set(hasil.data.map(item => item.city))];
      setDaftarKota(kotaUnik);
      if (kotaUnik.length > 0) {
        setKotaTerpilih(kotaUnik[0]);
      }
    };
    ambilData();
  }, []);

  const ambilJadwalHariIni = (kota) => {
    const hariIni = dayjs().format('D MMMM YYYY');
    
    const jadwal = dataJadwal.find(
      item => item.city === kota && item.date === hariIni
    );
    
    return jadwal;
  };

  const urutkanWaktuSholat = (jadwal) => {
    if (!jadwal) return [];
    
    const urutan = ['imsak', 'subuh', 'terbit', 'duha', 'dzuhur', 'ashar', 'maghrib', 'isya'];
    return Object.entries(jadwal)
      .filter(([key]) => key !== 'city' && key !== 'date')
      .sort(([a], [b]) => urutan.indexOf(a) - urutan.indexOf(b));
  };

  const formatNamaWaktu = (nama) => {
    const peta = {
      'imsak': 'Imsak',
      'subuh': 'Subuh',
      'terbit': 'Terbit',
      'duha': 'Duha',
      'dzuhur': 'Dzuhur',
      'ashar': 'Ashar',
      'maghrib': 'Maghrib',
      'isya': 'Isya'
    };
    return peta[nama] || nama;
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem('notificationsEnabled', JSON.stringify(true));
          toast({
            title: 'Notifikasi Diaktifkan',
            status: 'success',
            duration: 3000,
          });
        }
      } catch (error) {
        toast({
          title: 'Gagal mengaktifkan notifikasi',
          status: 'error',
          duration: 3000,
        });
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('notificationsEnabled', JSON.stringify(false));
    }
  };

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      if (kotaTerpilih && ambilJadwalHariIni(kotaTerpilih)) {
        updateNextPrayer();
        updatePrayerCountdowns();
        checkAndNotifyPrayer(); // Add notification check
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [kotaTerpilih, notificationsEnabled]);

  const checkAndNotifyPrayer = () => {
    if (!notificationsEnabled) return;

    const jadwal = ambilJadwalHariIni(kotaTerpilih);
    if (!jadwal) return;

    const waktuSholat = urutkanWaktuSholat(jadwal);
    const now = dayjs();

    for (const [nama, waktu] of waktuSholat) {
      const [hours, minutes] = waktu.split(':').map(Number);
      const prayerTime = dayjs().hour(hours).minute(minutes).second(0);
      const diff = prayerTime.diff(now, 'minutes');

      // Notify 10 minutes before prayer time
      if (diff === 10) {
        new Notification(`Waktu ${formatNamaWaktu(nama)} dalam 10 menit`, {
          body: `${formatNamaWaktu(nama)} akan masuk pada ${waktu}`,
          icon: '/logo.png'
        });

        // Play notification sound
        playNotificationSound();
      }
    }
  };

  const updatePrayerCountdowns = () => {
    const jadwal = ambilJadwalHariIni(kotaTerpilih);
    if (!jadwal) return;

    const waktuSholat = urutkanWaktuSholat(jadwal);
    const now = dayjs();
    const newCountdowns = {};

    for (const [nama, waktu] of waktuSholat) {
      const [hours, minutes] = waktu.split(':').map(Number);
      const prayerTime = dayjs().hour(hours).minute(minutes).second(0);
      const diff = prayerTime.diff(now);
      
      if (diff > 0) {
        const duration = dayjs.duration(diff);
        newCountdowns[nama] = `${String(duration.hours()).padStart(2, '0')}:${String(duration.minutes()).padStart(2, '0')}:${String(duration.seconds()).padStart(2, '0')}`;
      } else {
        // If prayer time has passed, show countdown to next day's prayer time
        const nextDayPrayerTime = dayjs().add(1, 'day').hour(hours).minute(minutes).second(0);
        const nextDiff = nextDayPrayerTime.diff(now);
        const duration = dayjs.duration(nextDiff);
        newCountdowns[nama] = `${String(duration.hours()).padStart(2, '0')}:${String(duration.minutes()).padStart(2, '0')}:${String(duration.seconds()).padStart(2, '0')}`;
      }
    }

    setPrayerCountdowns(newCountdowns);
  };

  const updateNextPrayer = () => {
    const jadwal = ambilJadwalHariIni(kotaTerpilih);
    if (!jadwal) return;

    const waktuSholat = urutkanWaktuSholat(jadwal);
    const now = dayjs();
    
    let nextPrayerFound = false;
    for (const [nama, waktu] of waktuSholat) {
      const [hours, minutes] = waktu.split(':').map(Number);
      const prayerTime = dayjs().hour(hours).minute(minutes).second(0);
      const diff = prayerTime.diff(now);
      
      if (diff > 0) {
        setNextPrayer({ name: formatNamaWaktu(nama), time: waktu });
        const duration = dayjs.duration(diff);
        setCountdown(`${String(duration.hours()).padStart(2, '0')}:${String(duration.minutes()).padStart(2, '0')}:${String(duration.seconds()).padStart(2, '0')}`);
        nextPrayerFound = true;
        break;
      }
    }

    if (!nextPrayerFound) {
      // If no next prayer found today, set to first prayer of next day
      const [firstPrayer, firstTime] = waktuSholat[0];
      const [hours, minutes] = firstTime.split(':').map(Number);
      const nextDayPrayerTime = dayjs().add(1, 'day').hour(hours).minute(minutes).second(0);
      const diff = nextDayPrayerTime.diff(now);
      const duration = dayjs.duration(diff);
      setNextPrayer({ name: formatNamaWaktu(firstPrayer), time: firstTime });
      setCountdown(`${String(duration.hours()).padStart(2, '0')}:${String(duration.minutes()).padStart(2, '0')}:${String(duration.seconds()).padStart(2, '0')}`);
    }
  };

  const ClockIcon = ({ time }) => {
    const [hours, minutes] = time.split(':').map(Number);
    const angle = ((hours % 12) + minutes / 60) * 30;
    
    return (
      <Box position="relative" width="20px" height="20px">
        <Circle
          size="20px"
          border="2px solid"
          borderColor="currentColor"
        />
        <Box
          as="div"
          position="absolute"
          top="50%"
          left="50%"
          width="1px"
          height="6px"
          bg="currentColor"
          transformOrigin="bottom"
          transform={`translate(-50%, -100%) rotate(${angle}deg)`}
        />
      </Box>
    );
  };

  return (
    <Box minH="100vh" bg={warnaBg}  
      bgImage="url('/pattern.png')"
      bgRepeat="repeat"
      bgSize="100px"
      py={{ base: 8, md: 12 }}
      px={{ base: 3, md: 4 }}
      position="relative"
      overflow="hidden"
    >
      {/* Dekoratif Elements */}
      <Box
        position="absolute"
        top={{ base: "10px", md: "20px" }}
        right={{ base: "10px", md: "20px" }}
        width={{ base: "150px", md: "200px" }}
        height={{ base: "150px", md: "200px" }}
        bgImage="url('/ornament1.png')"
        bgSize="contain"
        bgRepeat="no-repeat"
        opacity={0.15}
        transform="rotate(-5deg)"
      />
      <Box
        position="absolute"
        bottom={{ base: "10px", md: "20px" }}
        left={{ base: "10px", md: "20px" }}
        width={{ base: "150px", md: "200px" }}
        height={{ base: "150px", md: "200px" }}
        bgImage="url('/ornament2.png')"
        bgSize="contain"
        bgRepeat="no-repeat"
        opacity={0.15}
        transform="rotate(5deg)"
      />

      <Container maxW="container.lg">
        <VStack spacing={{ base: 6, md: 10 }} align="stretch">
          {/* Theme and Notification Controls */}
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={3}>
            <Image
              src="/logo.png"
              alt="Logo Jadwal Imsakiyah"
              height="50px"
              _hover={{
                transform: 'scale(1.05)',
                transition: 'transform 0.3s ease',
              }}
            />
            <Box display="flex" gap={3}>
              <IconButton
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                aria-label="Toggle color mode"
                size="lg"
                variant="outline"
                borderColor={warnaBorder}
              />
              <IconButton
                icon={<BellIcon />}
                onClick={toggleNotifications}
                aria-label="Toggle notifications"
                colorScheme={notificationsEnabled ? 'green' : 'gray'}
                size="lg"
                variant="outline"
                borderColor={warnaBorder}
              />
              <IconButton
                icon={<CalendarIcon />}
                onClick={() => setIsCalendarOpen(true)}
                aria-label="Show calendar"
                size="lg"
                variant="outline"
                borderColor={warnaBorder}
              />
            </Box>
          </Box>

          {/* Hero Section with Header and Countdown */}
          <Box
            position="relative"
            borderRadius="3xl"
            overflow="hidden"
            bg={warnaKartu}
            borderWidth="2px"
            borderColor={warnaBorder}
            boxShadow="2xl"
            p={{ base: 6, md: 12 }}
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgGradient: 'radial(circle at top left, green.50, transparent 70%)',
              opacity: 0.1,
              zIndex: 0
            }}
            _after={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgImage: "url('/pattern.png')",
              bgRepeat: 'repeat',
              bgSize: '100px',
              opacity: 0.05,
              zIndex: 0,
              transform: 'rotate(10deg)',
              filter: 'blur(1px)'
            }}
            transition="all 0.3s ease-in-out"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: '3xl'
            }}
          >
            <VStack spacing={{ base: 4, md: 6 }} position="relative" zIndex={1}>
              <Box textAlign="center" width="full">
                <Heading
                  as="h1"
                  size="2xl"
                  mb={8}
                  pb={3}
                  bgGradient={warnaGradient}
                  bgClip="text"
                  fontFamily="'Noto Sans Arabic', sans-serif"
                  className="arabic-text"
                  animation={`${glowAnimation} 3s ease-in-out infinite`}
                  fontSize={{ base: "4xl", md: "6xl" }}
                  letterSpacing="wider"
                  textShadow="lg"
                  transform="scale(1.1)"
                  _hover={{
                    transform: 'scale(1.15)',
                    transition: 'transform 0.3s ease-in-out'
                  }}
                >
                  رمضان كريم
                </Heading>
                
                <Heading 
                  as="h2" 
                  size="lg" 
                  mb={4}
                  color={warnaTeks}
                  fontWeight="bold"
                >
                  Jadwal Imsakiyah Ramadhan 1445H
                </Heading>
                
                <Text 
                  fontSize="xl" 
                  color={warnaTeksSubtle}
                  fontWeight="medium"
                  mb={6}
                >
                  {dayjs().format('dddd, D MMMM YYYY')}
                </Text>
              </Box>

              {nextPrayer.name && (
                <Box
                  mt={{ base: 4, md: 8 }}
                  p={{ base: 6, md: 8 }}
                  bg={warnaBoxBg}
                  borderRadius="3xl"
                  borderWidth="3px"
                  borderColor={warnaBorder}
                  textAlign="center"
                  w="full"
                  maxW="md"
                  mx="auto"
                  boxShadow="2xl"
                  position="relative"
                  transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    borderRadius: '3xl',
                    background: 'linear-gradient(45deg, green.200, teal.200)',
                    opacity: 0.1,
                    zIndex: -1
                  }}
                  _hover={{
                    boxShadow: "3xl",
                    borderColor: "green.500",
                    transform: "translateY(-4px)"
                  }}
                >
                  <Text fontSize={{ base: "md", md: "lg" }} color={warnaTeksSubtle} mb={2}>
                    Waktu Menuju {nextPrayer.name}
                  </Text>
                  <Text
                    fontSize={{ base: "3xl", md: "4xl" }}
                    fontWeight="bold"
                    fontFamily="mono"
                    color={warnaTeks}
                    letterSpacing="wider"
                  >
                    {countdown}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>

          {/* Pemilihan Kota */}
          <Card 
            bg={warnaKartu} 
            borderRadius="2xl" 
            borderWidth="2px" 
            borderColor={warnaBorder}
            boxShadow="xl"
            _hover={{ transform: 'translateY(-4px)', transition: 'all 0.3s ease' }}
          >
            <CardBody>
              <Select
                value={kotaTerpilih}
                onChange={(e) => setKotaTerpilih(e.target.value)}
                placeholder="Pilih Kota"
                size="lg"
                bg={warnaSelectBg}
                _hover={{ bg: warnaSelectHover }}
                borderColor={warnaBorder}
                borderWidth="2px"
                borderRadius="xl"
                icon={<Box as="span" className="select-icon">▼</Box>}
                p={2}
              >
                {daftarKota.map((kota) => (
                  <option key={kota} value={kota}>
                    {kota}
                  </option>
                ))}
              </Select>
            </CardBody>
          </Card>

          {/* Tampilan Jadwal */}
          {kotaTerpilih && ambilJadwalHariIni(kotaTerpilih) && (
            <Card
              bg={warnaKartu}
              borderRadius="xl"
              borderWidth="2px"
              borderColor={warnaBorder}
              boxShadow="lg"
              overflow="hidden"
              _hover={{ transform: 'translateY(-2px)', transition: 'all 0.2s' }}
            >
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading 
                    size="md" 
                    color={warnaTeks} 
                    textAlign="center"
                    pb={4}
                    borderBottom="2px solid"
                    borderColor={warnaBorder}
                  >
                    {kotaTerpilih}
                  </Heading>
                  <SimpleGrid 
                    columns={{ base: 1, sm: 2, md: 4 }} 
                    spacing={{ base: 3, md: 6 }}
                    pt={4}
                    pb={2}
                  >
                    {urutkanWaktuSholat(ambilJadwalHariIni(kotaTerpilih)).map(([nama, waktu]) => (
                      <Box 
                        key={nama} 
                        p={{ base: 3, md: 5 }}
                        borderRadius="xl"
                        bg={warnaBoxBg}
                        textAlign="center"
                        border="2px solid"
                        borderColor={warnaBorder}
                        transition="all 0.4s ease"
                        boxShadow="sm"
                        _hover={{
                          transform: { base: 'none', md: 'translateY(-4px)' },
                          boxShadow: { base: 'sm', md: 'lg' },
                          borderColor: 'green.500'
                        }}
                      >
                        <Text 
                          fontSize={{ base: "sm", md: "lg" }}
                          color={warnaTeksSubtle}
                          fontWeight="semibold"
                          mb={{ base: 2, md: 4 }}
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          {formatNamaWaktu(nama)}
                        </Text>
                        <Flex 
                          direction="column"
                          align="center" 
                          justify="center" 
                          gap={{ base: 2, md: 4 }}
                          bg={flexBgColor}
                          p={{ base: 2, md: 3 }}
                          borderRadius="lg"
                          boxShadow="inner"
                        >
                          <Flex 
                            align="center" 
                            justify="center" 
                            gap={{ base: 2, md: 4 }}
                          >
                            <Box 
                              position="relative" 
                              width={{ base: "35px", md: "45px" }} 
                              height={{ base: "35px", md: "45px" }}
                              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
                            >
                              <Circle
                                size={{ base: "35px", md: "45px" }}
                                border="2px solid"
                                borderColor={circleBorderColor}
                              />
                              <Box
                                as="div"
                                position="absolute"
                                top="50%"
                                left="50%"
                                width="2px"
                                height={{ base: "12px", md: "16px" }}
                                bg={clockHandleColor}
                                transformOrigin="bottom"
                                transform={`translate(-50%, -100%) rotate(${((Number(waktu.split(':')[0]) % 12) + Number(waktu.split(':')[1]) / 60) * 30}deg)`}
                              />
                            </Box>
                            <Text
                              fontSize={{ base: "xl", md: "3xl" }}
                              color={warnaTeks}
                              fontWeight="bold"
                              fontFamily="mono"
                            >
                              {waktu}
                            </Text>
                          </Flex>
                          <Text
                            fontSize={{ base: "sm", md: "md" }}
                            color={warnaTeksSubtle}
                            fontFamily="mono"
                          >
                            {prayerCountdowns[nama] ? `${prayerCountdowns[nama]}` : '--:--:--'}
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>

      {/* Calendar Modal */}
      <Modal isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} size={{ base: "full", md: "4xl" }} motionPreset="slideInBottom">
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.4)" />
        <ModalContent 
          bg={warnaKartu} 
          borderWidth="2px" 
          borderColor={warnaBorder} 
          borderRadius={{ base: "xl", md: "2xl" }}
          boxShadow="2xl"
          mx={{ base: 0, md: 4 }}
          my={{ base: 0, md: 8 }}
          h={{ base: "100vh", md: "auto" }}
          overflow="hidden"
          _hover={{ transform: { base: "none", md: "scale(1.01)" }, transition: "all 0.3s ease" }}
        >
          <ModalHeader
            borderBottom="2px solid"
            borderColor={warnaBorder}
            color={warnaTeks}
            textAlign="center"
            fontSize={{ base: "xl", md: "2xl" }}
            py={{ base: 4, md: 6 }}
            bgGradient={warnaGradient}
            bgClip="text"
            fontWeight="bold"
            letterSpacing="wide"
          >
            Jadwal Imsakiyah - {kotaTerpilih}
          </ModalHeader>
          <ModalCloseButton color={warnaTeks} size="lg" m={{ base: 2, md: 4 }} />
          <ModalBody p={{ base: 4, md: 8 }}>
            <Grid 
              templateColumns={{ 
                base: "repeat(1, 1fr)", 
                sm: "repeat(2, 1fr)", 
                md: "repeat(3, 1fr)", 
                lg: "repeat(4, 1fr)" 
              }} 
              gap={{ base: 4, md: 6 }}
              maxH={{ base: "calc(100vh - 150px)", md: "65vh" }} 
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'var(--chakra-colors-green-500)',
                  borderRadius: '4px',
                },
              }}
            >
              {dataJadwal
                .filter(item => item.city === kotaTerpilih)
                .map((jadwal, index) => (
                  <Box
                    key={index}
                    p={{ base: 4, md: 6 }}
                    borderWidth="2px"
                    borderRadius="xl"
                    borderColor={warnaBorder}
                    bg={warnaBoxBg}
                    transition="all 0.3s ease"
                    _hover={{
                      transform: { base: "none", md: "translateY(-4px)" },
                      boxShadow: "xl",
                      borderColor: "green.500"
                    }}
                  >
                    <Text
                      fontWeight="bold"
                      fontSize="xl"
                      mb={4}
                      color={warnaTeks}
                      textAlign="center"
                      bgGradient={warnaGradient}
                      bgClip="text"
                      letterSpacing="wide"
                    >
                      {dayjs(jadwal.date, "D MMMM YYYY").format("D")} Ramadhan 
                    </Text>
                    <VStack spacing={3} align="stretch">
                      {["imsak", "subuh", "maghrib", "isya"].map(waktu => (
                        <Box
                          key={waktu}
                          p={3}
                          borderRadius="lg"
                          bg={useColorModeValue("white", "gray.700")}
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          transition="all 0.2s"
                          _hover={{
                            transform: "translateX(4px)",
                            boxShadow: "md"
                          }}
                        >
                          <Text 
                            color={warnaTeksSubtle}
                            fontWeight="medium"
                            fontSize="md"
                          >
                            {formatNamaWaktu(waktu)}
                          </Text>
                          <Text
                            color={warnaTeks}
                            fontWeight="bold"
                            fontSize="lg"
                            fontFamily="mono"
                          >
                            {jadwal[waktu]}
                          </Text>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                ))}
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Footer */}
      <Box
        as="footer"
        mt={{ base: 8, md: 12 }}
        py={6}
        px={4}
        bg={flexBgColor}
        borderTop="2px solid"
        borderColor={warnaBorder}
        position="relative"
        zIndex={1}
      >
        <Container maxW="container.lg">
          <VStack spacing={4}>
            <Image
              src="/logo.png"
              alt="Logo Jadwal Imsakiyah"
              height="40px"
              opacity={0.8}
              _hover={{ opacity: 1, transform: 'scale(1.05)', transition: 'all 0.3s ease' }}
            />
            <Text color={warnaTeks} fontSize="sm" textAlign="center">
              Jadwal Imsakiyah Ramadhan 1445H adalah aplikasi yang membantu Anda mengetahui waktu sholat dan imsak selama bulan Ramadhan.
            </Text>
            
            <Text color={warnaTeksSubtle} fontSize="xs">
              © {new Date().getFullYear()} Alyssa Cakes & Bakery. All rights reserved.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

export default App;
