/**
 * ReactNativeBridge.js
 * Sample code: Understanding and optimizing React Native Bridge
 */

import { NativeModules, NativeEventEmitter } from 'react-native';
import { useEffect, useCallback, useState } from 'react';

/**
 * ============================================
 * EXAMPLE 1: BASIC BRIDGE COMMUNICATION
 * ============================================
 * This demonstrates how to communicate with native modules
 * through the React Native Bridge
 */

// Access native module (previously registered in native code)
const { CameraModule } = NativeModules;

/**
 * Poor Performance Example: Multiple Sequential Bridge Calls
 * ❌ DON'T: This causes repeated Bridge crosses
 */
const poorBridgeCommunication = async () => {
  try {
    // Call 1: Ask for permission
    const hasPermission = await CameraModule.checkCameraPermission();
    
    // Call 2: Request permission (waits for Call 1)
    if (!hasPermission) {
      await CameraModule.requestCameraPermission();
    }
    
    // Call 3: Get camera info (waits for Call 2)
    const cameraInfo = await CameraModule.getCameraInfo();
    
    // Call 4: Initialize camera (waits for Call 3)
    await CameraModule.initializeCamera();
    
    // Result: 4 separate Bridge crossings = Performance hit
  } catch (error) {
    console.error('Camera setup failed:', error);
  }
};

/**
 * Good Performance Example: Batched Bridge Calls
 * ✅ DO: Batch operations into single Bridge call
 */
const goodBridgeCommunication = async () => {
  try {
    // Single Bridge call handling multiple operations
    const result = await CameraModule.setupCamera();
    
    // Result: 1 bridge crossing, operations done on native side
    const { hasPermission, cameraInfo, isInitialized } = result;
    
    console.log('Camera ready:', { hasPermission, cameraInfo, isInitialized });
  } catch (error) {
    console.error('Camera setup failed:', error);
  }
};

/**
 * ============================================
 * EXAMPLE 2: BRIDGE WITH STATE MANAGEMENT
 * ============================================
 * Managing Bridge calls with React hooks
 */

const useCameraModule = () => {
  const [cameraState, setCameraState] = useState({
    isReady: false,
    error: null,
    cameraInfo: null,
  });

  /**
   * Initialize camera with Bridge communication
   * Using useCallback to memoize the function
   */
  const initializeCamera = useCallback(async () => {
    try {
      setCameraState((prev) => ({ ...prev, error: null }));
      
      // Batched Bridge call
      const cameraInfo = await CameraModule.setupCamera();
      
      setCameraState({
        isReady: true,
        error: null,
        cameraInfo,
      });
    } catch (error) {
      setCameraState({
        isReady: false,
        error: error.message,
        cameraInfo: null,
      });
    }
  }, []);

  /**
   * Take photo with Bridge communication
   * Minimal data passed across Bridge
   */
  const takePhoto = useCallback(async (options = {}) => {
    try {
      // Only send necessary options
      const photoPath = await CameraModule.takePhoto({
        quality: options.quality || 0.8,
        // Don't send unnecessary data
      });
      return photoPath;
    } catch (error) {
      setCameraState((prev) => ({ ...prev, error: error.message }));
      return null;
    }
  }, []);

  return { cameraState, initializeCamera, takePhoto };
};

/**
 * ============================================
 * EXAMPLE 3: LISTENING FOR NATIVE EVENTS
 * ============================================
 * Receiving events from native modules via Bridge
 */

const useCameraEvents = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Create event emitter for native module
    const { CameraEvents } = NativeModules;
    const cameraEventEmitter = new NativeEventEmitter(CameraEvents);

    /**
     * Listen for camera ready event
     * Bridge sends events asynchronously (non-blocking)
     */
    const cameraReadySubscription = cameraEventEmitter.addListener(
      'cameraReady',
      (data) => {
        console.log('Camera is ready:', data);
        setEvents((prev) => [...prev, { type: 'ready', data }]);
      }
    );

    /**
     * Listen for frame captured events
     * Great for real-time processing
     */
    const frameSubscription = cameraEventEmitter.addListener(
      'frameCapture',
      (frameData) => {
        // Process frame (on native side to avoid Bridge overhead)
        console.log('Frame captured:', frameData);
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      cameraReadySubscription.remove();
      frameSubscription.remove();
    };
  }, []);

  return events;
};

/**
 * ============================================
 * EXAMPLE 4: HANDLING LARGE DATA TRANSFERS
 * ============================================
 * Best practices when sending large amounts of data
 */

/**
 * ❌ DON'T: Send large image buffer across Bridge repeatedly
 */
const procesImagePoorly = async (imageBuffer) => {
  // Large data copy across Bridge = slow
  const result = await NativeModules.ImageProcessor.processImage(
    imageBuffer // 5MB+ buffer serialization
  );
  return result;
};

/**
 * ✅ DO: Pass file path instead, let native handle file access
 */
const processImageWell = async (imagePath) => {
  // Only small string across Bridge
  const result = await NativeModules.ImageProcessor.processImageAtPath(
    imagePath // Just file path reference
  );
  return result;
};

/**
 * ✅ DO: Batch multiple operations into single call
 */
const procesMultipleImagesWell = async (imagePaths) => {
  // Single Bridge call for all images
  const results = await NativeModules.ImageProcessor.procesImageBatch(
    imagePaths // Array of file paths
  );
  return results;
};

/**
 * ============================================
 * EXAMPLE 5: COMPLETE IMPLEMENTATION
 * ============================================
 * Full component using Bridge with optimization
 */

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

const BridgeOptimizedComponent = () => {
  const { cameraState, initializeCamera, takePhoto } = useCameraModule();
  const events = useCameraEvents();

  /**
   * Handle camera setup
   * Batched Bridge call + optimized event handling
   */
  const handleSetupCamera = useCallback(async () => {
    await initializeCamera();
  }, [initializeCamera]);

  /**
   * Batch photo processing
   */
  const handleTakePhotos = useCallback(async () => {
    const photos = [];
    
    // Take 5 photos - still uses efficient Bridge calls
    for (let i = 0; i < 5; i++) {
      const photo = await takePhoto({ quality: 0.8 });
      if (photo) photos.push(photo);
    }
    
    // Batch process all photos with single Bridge call
    if (photos.length > 0) {
      await NativeModules.PhotoProcessor.batchProcessPhotos(photos);
    }
  }, [takePhoto]);

  return (
    <View style={styles.container}>
      <View style={styles.statusSection}>
        <Text style={styles.title}>Bridge Communication Status</Text>
        <Text style={[styles.status, cameraState.isReady ? styles.ready : styles.notReady]}>
          Camera: {cameraState.isReady ? 'Ready' : 'Not Ready'}
        </Text>
        {cameraState.error && (
          <Text style={styles.error}>Error: {cameraState.error}</Text>
        )}
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity style={styles.button} onPress={handleSetupCamera}>
          <Text style={styles.buttonText}>Initialize Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, !cameraState.isReady && styles.disabled]}
          onPress={handleTakePhotos}
          disabled={!cameraState.isReady}
        >
          <Text style={styles.buttonText}>Take Photos (Batch)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventsSection}>
        <Text style={styles.title}>Bridge Events Received</Text>
        <FlatList
          data={events}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <Text style={styles.event}>{item.type}: {JSON.stringify(item.data)}</Text>
          )}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  statusSection: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  buttonSection: {
    marginBottom: 20,
  },
  eventsSection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
    marginVertical: 5,
  },
  ready: {
    color: '#4CAF50',
  },
  notReady: {
    color: '#ff6b6b',
  },
  error: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  disabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  event: {
    fontSize: 12,
    color: '#333',
    marginVertical: 5,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default BridgeOptimizedComponent;

/**
 * ============================================
 * KEY PERFORMANCE TAKEAWAYS
 * ============================================
 * 
 * 1. BATCH OPERATIONS
 *    - Combine multiple Bridge calls into one
 *    - Reduces queue congestion
 *
 * 2. MINIMIZE DATA TRANSFERS
 *    - Pass file paths instead of buffers
 *    - Send only required fields
 *
 * 3. USE EVENT EMITTERS
 *    - Receive updates without polling
 *    - Async communication (non-blocking)
 *
 * 4. PROFILE YOUR BRIDGE USAGE
 *    - React Native DevTools can show Bridge performance
 *    - Watch for frequent small calls
 *
 * 5. LEVERAGE NATIVE MODULES
 *    - Offload heavy computation to native
 *    - Let native handle large data processing
 */
