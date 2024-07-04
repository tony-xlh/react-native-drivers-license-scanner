/* eslint-disable react-hooks/exhaustive-deps */
import React, {useEffect, useRef, useState} from 'react';
import {Alert, Dimensions, Platform, StyleSheet} from 'react-native';
import {
  Camera,
  PhotoFile,
  runAsync,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';
import * as DDN from 'vision-camera-dynamsoft-document-normalizer';
import {Svg, Polygon} from 'react-native-svg';
import {DetectedQuadResult, Point} from 'vision-camera-dynamsoft-document-normalizer';
import {Worklets, useSharedValue} from 'react-native-worklets-core';
import {getRectFromPoints, intersectionOverUnion, sleep} from '../Utils';

export interface ScannerProps{
  onScanned?: (photo:PhotoFile|null,points:Point[]|null) => void;
}

function DLScanner(props:ScannerProps): React.JSX.Element {
  const takenShared = useSharedValue(false);
  const camera = useRef<Camera|null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [pointsText, setPointsText] = useState('default');
  const [viewBox, setViewBox] = useState('0 0 1080 1920');
  const previousResults = useRef([] as DetectedQuadResult[]);
  const [detectionResults, setDetectionResults] = useState(
    [] as DetectedQuadResult[],
  );
  const device = useCameraDevice('back');
  const cameraFormat = useCameraFormat(device, [
    { videoAspectRatio: 16 / 9 },
    { photoAspectRatio: 16 / 9 },
    { videoResolution: { width: 1920, height: 1080 } },
    { fps: 60 },
  ]);
  const photoTaken = useRef(false);
  const frameWidth = useSharedValue(1920);
  const frameHeight = useSharedValue(1080);
  const convertAndSetResults = (
    records: Record<string, DetectedQuadResult>,
  ) => {
    let results: DetectedQuadResult[] = [];
    for (let index = 0; index < Object.keys(records).length; index++) {
      const result = records[Object.keys(records)[index]];
      const rect = getRectFromPoints(result.location.points);
      if (rect.width / getFrameSize()[0].value < 0.95) {
        //avoid full screen misdetection
        results.push(result);
      }
    }
    setDetectionResults(results);
  };
  const getFrameSize = () => {
    let width, height;
    if (
      frameWidth > frameHeight &&
      Dimensions.get('window').width > Dimensions.get('window').height
    ) {
      width = frameWidth;
      height = frameHeight;
    } else {
      console.log('Has rotation');
      width = frameHeight;
      height = frameWidth;
    }
    return [width, height];
  };

  const updateViewBox = () => {
    const frameSize = getFrameSize();
    setViewBox('0 0 ' + frameSize[0] + ' ' + frameSize[1]);
    console.log('viewBox' + viewBox);
  };
  const convertAndSetResultsJS = Worklets.createRunOnJS(convertAndSetResults);
  React.useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
      setIsActive(true);
    })();
  }, []);

  React.useEffect(() => {
    updateViewBox();
    updatePointsData();
  }, [detectionResults]);

  const updatePointsData = () => {
    if (detectionResults.length > 0) {
      let result = detectionResults[0];
      if (result) {
        let location = result.location;
        let pointsData = location.points[0].x + ',' + location.points[0].y + ' ';
        pointsData = pointsData + location.points[1].x + ',' + location.points[1].y + ' ';
        pointsData = pointsData + location.points[2].x + ',' + location.points[2].y + ' ';
        pointsData = pointsData + location.points[3].x + ',' + location.points[3].y;
        console.log(pointsData);
        setPointsText(pointsData);
      }
    } else {
      setPointsText('default');
    }
  };

  useEffect(() => {
    if (pointsText !== 'default') {
      checkIfSteady();
    }
  }, [pointsText]);

  const checkIfSteady = async () => {
    if (detectionResults.length === 0) {
      return;
    }
    let result = detectionResults[0];
    if (result) {
      if (previousResults.current.length >= 2) {
        previousResults.current.push(result);
        if (steady() === true) {
          await takePhoto();
          console.log('steady');
        }else{
          console.log('shift result');
          previousResults.current.shift();
        }
      }else{
        console.log('add result');
        previousResults.current.push(result);
      }
    }
  };

  const steady = () => {
    if (previousResults.current[0] && previousResults.current[1] && previousResults.current[2]) {
      let iou1 = intersectionOverUnion(previousResults.current[0].location.points,previousResults.current[1].location.points);
      let iou2 = intersectionOverUnion(previousResults.current[1].location.points,previousResults.current[2].location.points);
      let iou3 = intersectionOverUnion(previousResults.current[0].location.points,previousResults.current[2].location.points);
      console.log(iou1);
      console.log(iou2);
      console.log(iou3);
      if (iou1 > 0.9 && iou2 > 0.9 && iou3 > 0.9) {
        return true;
      }else{
        return false;
      }
    }
    return false;
  };

  const takePhoto = async () => {
    console.log('should take photo');
    if (camera.current && photoTaken.current === false) {
      console.log('take photo');
      photoTaken.current = true;
      takenShared.value = true;
      await sleep(100);
      const photo = await camera.current.takePhoto();
      if (photo) {
        setIsActive(false);
        if (props.onScanned) {
          props.onScanned(
            photo,
            scaledPoints(previousResults.current[0],photo.width,photo.height)
          );
        }
      }else{
        Alert.alert('','Failed to take a photo');
      }
    }
  };

  const scaledPoints = (quad:DetectedQuadResult,photoWidth:number,photoHeight:number) => {
    let frameW = getFrameSize()[0].value;
    let frameH = getFrameSize()[1].value;
    if (frameW<frameH && photoWidth>photoHeight) {
      let temp = photoWidth;
      photoWidth = photoHeight;
      photoHeight = temp;
    }
    console.log(photoWidth);
    console.log(photoHeight);
    let points = JSON.parse(JSON.stringify(quad.location.points));
    if (frameW/frameH == photoWidth/photoHeight) {
      console.log("scale");
      for (let index = 0; index < points.length; index++) {
        const point = points[index];
        point.x = Math.ceil(point.x / (frameW / photoWidth));
        point.y = Math.ceil(point.y / (frameH / photoHeight));
        point.x = Math.min(photoWidth,point.x);
        point.y = Math.min(photoHeight,point.y);
      }
    }else{
      return null;
    }
    return points;
  };

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    
    if (takenShared.value == false) {
      console.log('detect frame');
      runAsync(frame, () => {
        'worklet';
        try {
          const results = DDN.detect(frame);
          console.log(results);
          convertAndSetResultsJS(results);
        } catch (error) {
          console.log(error);
        }
      });
    }
    
  }, []);
  return (
    <>
      {device && hasPermission && (
        <>
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive}
            format={cameraFormat}
            photo={true}
            frameProcessor={frameProcessor}
            pixelFormat="yuv"
          />
          <Svg
            style={StyleSheet.absoluteFill}
            viewBox={viewBox}>
            {pointsText !== 'default' && (
              <Polygon
                points={pointsText}
                fill="lime"
                stroke="green"
                opacity="0.5"
                strokeWidth="1"
              />
            )}
          </Svg>
        </>
      )}
    </>
  );
}

export default DLScanner;
