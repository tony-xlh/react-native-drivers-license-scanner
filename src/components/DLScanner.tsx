import React from 'react';
import {StyleSheet} from 'react-native';
import {
  Camera,
  runAsync,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';
import * as DDN from 'vision-camera-dynamsoft-document-normalizer';

function DLScanner(): React.JSX.Element {
  const [hasPermission, setHasPermission] = React.useState(false);
  const [isActive, setIsActive] = React.useState(false);
  const device = useCameraDevice('back');
  const cameraFormat = useCameraFormat(device, [
    {videoResolution: {width: 1280, height: 720}},
    {fps: 60},
  ]);
  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      setIsActive(true);
    })();
  }, []);
  // eslint-disable-next-line prettier/prettier
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    console.log('detect frame');
    runAsync(frame, () => {
      'worklet';
      try {
        const results = DDN.detect(frame);
        console.log(results);
      } catch (error) {
        console.log(error);
      }
    });
  }, []);
  return (
    <>
      {device && hasPermission && (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            format={cameraFormat}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
          />
        </>
      )}
    </>
  );
}

export default DLScanner;
