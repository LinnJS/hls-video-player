import React, { useRef, useEffect, type VideoHTMLAttributes } from 'react';
import Hls, { type HlsConfig } from 'hls.js';

interface VideoPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  licenseUrl?: string;
  licenseHeaders?: Record<string, string>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, licenseUrl, licenseHeaders, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const hlsConfig: Partial<HlsConfig> = {};

// if drm is enabled then add the license url and headers
    if (licenseUrl && licenseHeaders) {
      const drmConfig: Partial<HlsConfig> = {
        emeEnabled: true,
        widevineLicenseUrl: licenseUrl,
        licenseXhrSetup: (xhr, _url, _keyContext, _licenseChallenge) => {
          Object.entries(licenseHeaders).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
          });
        },
        
      }

      Object.assign(hlsConfig, drmConfig);
    }
      

    const hls = new Hls(hlsConfig);

    const playVideo = async () => {
      if (video) {
        try {
          await video.play();
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }
    };

    if (Hls.isSupported() && video) {
      hls.attachMedia(video);
      hls.loadSource(src);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void (async () => {
          await playVideo();
        })();
      });

      return () => {
        hls.destroy();
      };

    } else if (video?.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;

      video.addEventListener('loadedmetadata', () => {
        void (async () => {
          await playVideo();
        })();
      });

      return () => {
        video.src = '';
        video.removeEventListener('loadedmetadata', () => null);
      };
    }
  }, [src, licenseUrl, licenseHeaders]);

  return <video ref={videoRef} {...props} />;
};


