import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Button,
  View,
  Text,
  BackHandler,
} from 'react-native';
import * as DBR from 'vision-camera-dynamsoft-barcode-reader';
import * as DDN from 'vision-camera-dynamsoft-document-normalizer';
import DLScanner from './components/DLScanner';
import { PhotoFile } from 'react-native-vision-camera';

function App(): React.JSX.Element {
  const [isScanning, setIsScanning] = React.useState(false);
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
        'DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ==',
      );
      console.log(DBRLicenseResult);
      console.log(DDNLicenseResult);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onScanned = (photo:PhotoFile|null) => {
    setIsScanning(false);
    console.log(photo);
  }
  return (
    <SafeAreaView style={styles.container}>
      {!isScanning && (
        <View style={styles.main}>
          <Text style={styles.title}>
            Dynamsoft Driver's License Scanner Demo
          </Text>
          <Button title="Start Scanning" onPress={() => setIsScanning(true)} />
        </View>
      )}
      {isScanning && <DLScanner onScanned={(photo)=> onScanned(photo)} />}
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
});

export default App;
