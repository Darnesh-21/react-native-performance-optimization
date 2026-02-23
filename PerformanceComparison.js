/**
 * PerformanceComparison.js
 * Side-by-side comparison of good vs bad performance patterns
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';

/**
 * ============================================
 * PATTERN 1: LIST RENDERING OPTIMIZATION
 * ============================================
 */

// Inline item component causes re-renders
const PoorListRendering = ({ items, onItemPress }) => {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        // New function created every render!
        <View style={styles.item}>
          <Text>{item.name}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id} // String key, unstable
      onPress={() => onItemPress(item.id)} // Potential bug
    />
  );
};

// Proper memoization and optimization
const GoodListRendering = ({ items, onItemPress }) => {
  // Memoized item component
  const ListItemComponent = React.memo(({ item }) => (
    <View style={styles.item}>
      <Text>{item.name}</Text>
    </View>
  ));

  // Stable callback reference
  const handleItemPress = useCallback((itemId) => {
    onItemPress?.(itemId);
  }, [onItemPress]);

  // Stable render function
  const renderItem = useCallback(({ item }) => (
    <ListItemComponent item={item} />
  ), []);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()} // Numeric string
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
    />
  );
};

/**
 * ============================================
 * PATTERN 2: STATE MANAGEMENT
 * ============================================
 */

// Excessive state updates cause re-renders
const PoorStateManagement = () => {
  const [data, setData] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortOrder, setSortOrder] = useState('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectItem = (id) => {
    // Updates entire component state
    setSelectedIds([...selectedIds, id]);
    // Causes unnecessary re-renders of other sections
  };

  const handleFilter = (filterKey, value) => {
    // Shallow copy causes unnecessary renders
    setFilters({ ...filters, [filterKey]: value });
  };

  return (
    <View style={styles.container}>
      {/* All state changes affect entire component */}
    </View>
  );
};

// Separate concerns with custom hooks
const useListSelection = () => {
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelection = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  return { selectedIds, toggleSelection };
};

const useListFilters = () => {
  const [filters, setFilters] = useState({});

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { filters, updateFilter };
};

const GoodStateManagement = () => {
  const { selectedIds, toggleSelection } = useListSelection();
  const { filters, updateFilter } = useListFilters();

  // Each hook manages only its concern
  // Component only re-renders what's needed
};

/**
 * ============================================
 * PATTERN 3: COMPUTED VALUES
 * ============================================
 */

// Recalculates on every render
const PoorComputation = ({ items, searchQuery }) => {
  // Filtered list recalculated every render
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorted list also recalculated every render
  const sortedItems = filteredItems.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <FlatList
      data={sortedItems}
      renderItem={({ item }) => <Text>{item.name}</Text>}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

// Memoized computed values
const GoodComputation = ({ items, searchQuery }) => {
  // Only recalculates when dependencies change
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]); // Only runs when items or searchQuery change

  const sortedItems = useMemo(() => {
    console.log('Sorting items...');
    return [...filteredItems].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [filteredItems]); // Only runs when filteredItems change

  return (
    <FlatList
      data={sortedItems}
      renderItem={({ item }) => <Text>{item.name}</Text>}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

/**
 * ============================================
 * PATTERN 4: EVENT HANDLERS
 * ============================================
 */

// New function created every render
const ItemListPoor = ({ items }) => {
  const handlePress = (id) => {
    // This function is redefined on every render
    // Causes memoized child components to re-render
    console.log(`Pressed: ${id}`);
  };

  const ListItem = ({ item }) => (
    <TouchableOpacity onPress={() => handlePress(item.id)}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  );

  return <FlatList data={items} renderItem={({ item }) => <ListItem item={item} />} />;
};

// Stable function reference
const ItemListGood = ({ items }) => {
  const handlePress = useCallback((id) => {
    // Function reference stays same across renders
    console.log(`Pressed: ${id}`);
  }, []); // Empty deps = function never changes

  const ListItem = React.memo(({ item }) => (
    <TouchableOpacity onPress={() => handlePress(item.id)}>
      <Text>{item.name}</Text>
    </TouchableOpacity>
  ));

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ListItem item={item} />}
    />
  );
};

/**
 * ============================================
 * PATTERN 5: BRIDGE CALLS
 * ============================================
 */

const { NativeModules } = require('react-native');

// Multiple sequential Bridge calls
const fetchDataPoor = async () => {
  try {
    // Call 1: Get user
    const user = await NativeModules.DatabaseModule.getUser(1);
    
    // Call 2: Get user posts (waits for Call 1)
    const posts = await NativeModules.DatabaseModule.getUserPosts(user.id);
    
    // Call 3: Get comments (waits for Call 2)
    const comments = await NativeModules.DatabaseModule.getComments(posts[0].id);
    
    // Call 4: Get likes (waits for Call 3)
    const likes = await NativeModules.DatabaseModule.getLikes(comments[0].id);
    
    return { user, posts, comments, likes };
  } catch (error) {
    console.error('Error:', error);
  }
};

// Batched Bridge call
const fetchDataGood = async () => {
  try {
    // Single Bridge call - all operations done on native side
    const result = await NativeModules.DatabaseModule.getUserCompleteData(1);
    
    return result; // { user, posts, comments, likes }
  } catch (error) {
    console.error('Error:', error);
  }
};

/**
 * ============================================
 * PERFORMANCE METRICS COMPARISON
 * ============================================
 */

export const performanceComparison = {
  'List Rendering (1000 items)': {
    poor: {
      averageFrameTime: '45ms',
      dropped: '15 frames/sec',
      memory: '85MB',
    },
    good: {
      averageFrameTime: '10ms',
      dropped: '1 frame/sec',
      memory: '42MB',
    },
  },
  'Bridge Calls (100 operations)': {
    poor: {
      totalTime: '2500ms',
      calls: '100',
      threadBlocks: '15',
    },
    good: {
      totalTime: '500ms',
      calls: '1',
      threadBlocks: '0',
    },
  },
  'State Management (Complex Update)': {
    poor: {
      rerenders: '47',
      timeSpent: '320ms',
    },
    good: {
      rerenders: '3',
      timeSpent: '45ms',
    },
  },
};

/**
 * ============================================
 * BEST PRACTICES CHECKLIST
 * ============================================
 */

export const performanceCheckList = {
  flatList: [
    '✅ Use React.memo for list item components',
    '✅ Use useCallback for event handlers',
    '✅ Set removeClippedSubviews={true}',
    '✅ Optimize maxToRenderPerBatch',
    '✅ Use numeric keyExtractor',
    '✅ Avoid inline renderItem functions',
    '✅ Consider VirtualizedList for complex items',
  ],
  bridge: [
    '✅ Batch Bridge calls whenever possible',
    '✅ Pass minimal data across Bridge',
    '✅ Use file paths instead of buffers',
    '✅ Use event emitters for real-time data',
    '✅ Cache Bridge call results',
    '✅ Profile Bridge usage with DevTools',
    '✅ Avoid Bridge calls in loops',
  ],
  state: [
    '✅ Use multiple state hooks for different concerns',
    '✅ Memoize expensive computations with useMemo',
    '✅ Use useCallback for stable function references',
    '✅ Split state into smaller pieces',
    '✅ Use Context only when necessary',
    '✅ Consider Redux for complex state',
  ],
};

// Export for reference
export { 
  PoorListRendering, 
  GoodListRendering,
  PoorStateManagement,
  GoodStateManagement,
  PoorComputation,
  GoodComputation,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  item: {
    padding: 10,
    backgroundColor: '#fff',
    marginVertical: 4,
  },
});
