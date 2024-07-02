import React from 'react';
import {SafeAreaView, StyleSheet, Button, View, Text} from 'react-native';
import * as DBR from 'vision-camera-dynamsoft-barcode-reader';
import * as DDN from 'vision-camera-dynamsoft-document-normalizer';
import DLScanner from './components/DLScanner';

function App(): React.JSX.Element {
  const [isScanning, setIsScanning] = React.useState(false);
  React.useEffect(() => {
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
  }, []);
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
      {isScanning && <DLScanner />}
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
