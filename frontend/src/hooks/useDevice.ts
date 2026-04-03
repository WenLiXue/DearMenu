import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  isWechat: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    userAgent: '',
    screenWidth: 1920,
    screenHeight: 1080,
    isWechat: false,
    isIOS: false,
    isAndroid: false,
  });

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const isTablet = /tablet|ipad|playbook|silk/i.test(ua) && !isMobile;
    const isDesktop = !isMobile && !isTablet;

    const isWechat = /micromessenger/i.test(ua);
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);

    let type: DeviceType = 'desktop';
    if (isMobile) type = 'mobile';
    else if (isTablet) type = 'tablet';

    setDeviceInfo({
      type,
      isMobile,
      isTablet,
      isDesktop,
      userAgent: navigator.userAgent,
      screenWidth: width,
      screenHeight: height,
      isWechat,
      isIOS,
      isAndroid,
    });

    // Listen for resize events
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newIsMobile = newWidth < 768;
      const newIsTablet = newWidth >= 768 && newWidth < 1024;
      const newIsDesktop = newWidth >= 1024;

      let newType: DeviceType = 'desktop';
      if (newIsMobile) newType = 'mobile';
      else if (newIsTablet) newType = 'tablet';

      setDeviceInfo((prev) => ({
        ...prev,
        type: newType,
        isMobile: newIsMobile,
        isTablet: newIsTablet,
        isDesktop: newIsDesktop,
        screenWidth: newWidth,
        screenHeight: window.innerHeight,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceInfo;
}

// Helper function to get device type string
export function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

// Helper function to check if WeChat browser
export function isWechatBrowser(): boolean {
  return /micromessenger/i.test(navigator.userAgent);
}
