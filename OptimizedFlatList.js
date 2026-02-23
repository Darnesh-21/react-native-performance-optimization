/**
 * OptimizedFlatList.js
 * Sample code: Preventing unnecessary re-renders in large flat lists
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * ListItem Component - Memoized to prevent unnecessary re-renders
 * Only re-renders if props actually change
 */
const ListItem = React.memo(({ item, onPress, onDelete }) => {
  console.log(`Rendering item: ${item.id}`);
  
  return (
    <TouchableOpacity 
      style={styles.listItem}
      onPress={() => onPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: return true if props are equal (skip re-render)
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.description === nextProps.item.description
  );
});

/**
 * Main FlatList Screen Component
 */
const OptimizedFlatListScreen = () => {
  const [items, setItems] = useState(
    Array.from({ length: 1000 }, (_, i) => ({
      id: i.toString(),
      name: `Item ${i + 1}`,
      description: `This is item number ${i + 1}`,
    }))
  );

  const [selectedItem, setSelectedItem] = useState(null);

  /**
   * useCallback ensures the same function reference is used
   * Prevents ListItem from re-rendering due to new function reference
   */
  const handleItemPress = useCallback((itemId) => {
    setSelectedItem(itemId);
    console.log(`Selected item: ${itemId}`);
  }, []);

  const handleDeleteItem = useCallback((itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    console.log(`Deleted item: ${itemId}`);
  }, []);

  /**
   * renderItem function - wrapped in useCallback to maintain reference
   */
  const renderItem = useCallback(({ item }) => (
    <ListItem
      item={item}
      onPress={handleItemPress}
      onDelete={handleDeleteItem}
    />
  ), [handleItemPress, handleDeleteItem]);

  /**
   * keyExtractor - provide unique, stable keys for list items
   * Critical for performance and view recycling
   */
  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        // Performance optimization props
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
        windowSize={10}
        // Improvement in scrolling performance
        scrollEventThrottle={16}
      />
      {selectedItem && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedText}>Selected: {selectedItem}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 4,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff6b6b',
    borderRadius: 6,
  },
  deleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default OptimizedFlatListScreen;
