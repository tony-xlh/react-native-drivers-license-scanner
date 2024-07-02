import React from 'react';
import {StyleSheet} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from 'react-native-vision-camera';

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
  return (
    <>
      {device && hasPermission && (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            format={cameraFormat}
            pixelFormat="yuv"
          />
        </>
      )}
    </>
  );
}

export default DLScanner;
