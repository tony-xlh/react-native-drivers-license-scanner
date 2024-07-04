import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Button,
  View,
  Text,
  BackHandler,
  Image,
} from 'react-native';
import * as DBR from 'vision-camera-dynamsoft-barcode-reader';
import * as DDN from 'vision-camera-dynamsoft-document-normalizer';
import DLScanner from './components/DLScanner';
import { PhotoFile } from 'react-native-vision-camera';
import { DetectedQuadResult } from 'vision-camera-dynamsoft-document-normalizer';

function App(): React.JSX.Element {
  const [photoBase64, setPhotoBase64] = useState<string|undefined>();
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeText, setBarcodeText] = useState("");
  React.useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', function () {
      if (!isScanning) {
        /**
         * When true is returned the event will not be bubbled up
         * & no other back action will execute
         */
        setIsScanning(false);
        return true;
      }
      /**
       * Returning false will let the event to bubble up & let other event listeners
       * or the system's default back action to be executed.
       */
      return false;
    });
    (async () => {
      const DBRLicenseResult = await DBR.initLicense(
        'DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==',
      );
      const DDNLicenseResult = await DDN.initLicense(
        'DLS2eyJoYW5kc2hha2VDb2RlIjoiMTAwMjI3NzYzLVRYbE5iMkpwYkdWUWNtOXEiLCJtYWluU2VydmVyVVJMIjoiaHR0cHM6Ly9tbHRzLmR5bmFtc29mdC5jb20iLCJvcmdhbml6YXRpb25JRCI6IjEwMDIyNzc2MyIsInN0YW5kYnlTZXJ2ZXJVUkwiOiJodHRwczovL3NsdHMuZHluYW1zb2Z0LmNvbSIsImNoZWNrQ29kZSI6LTM5MDUxMjkwOH0=',
      );
      console.log(DBRLicenseResult);
      console.log(DDNLicenseResult);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onScanned = async (photo:PhotoFile|null,points?:DDN.Point[]|null) => {
    setIsScanning(false);
    console.log('onScanned');
    console.log(photo);
    if (photo) {
      const detectedQuads = await DDN.detectFile(photo.path);
      if (detectedQuads.length > 0) {
        points = detectedQuads[0].location.points;
      }
      if (points) {
        let detectionResult:DetectedQuadResult = {
          confidenceAsDocumentBoundary:90,
          area:0,
          location:{
            points:[points[0]!,points[1]!,points[2]!,points[3]!],
          },
        };
        const result = await DDN.normalizeFile(photo.path,detectionResult.location,{includeNormalizationResultAsBase64:true});
        if (result.imageBase64) {
          setPhotoBase64(result.imageBase64);
          let barcodeResults = await DBR.decodeBase64(result.imageBase64);
          console.log(barcodeResults);
          if (barcodeResults.length > 0) {
            setBarcodeText(barcodeResults[0].barcodeText);
          }
        }
      }
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      {!isScanning && (
        <View style={styles.main}>
          <Text style={styles.title}>
            Dynamsoft Driver's License Scanner Demo
          </Text>
          <Button title="Start Scanning" onPress={() => setIsScanning(true)} />
          {photoBase64 && (
            <>
              <Text style={styles.scannedLbl}>
                Scanned:
              </Text>
              <Text>
                {barcodeText}
              </Text>
              <Image
                style={styles.image}
                source={{
                  uri: 'data:image/jpeg;base64,' + photoBase64,
                }}
              />
            </>
          )}
        </View>
      )}
      {isScanning && <DLScanner onScanned={(photo,points)=> onScanned(photo,points)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  main: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginVertical: 8,
  },
  scannedLbl:{
    marginTop: 8,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
  },
});

export default App;
