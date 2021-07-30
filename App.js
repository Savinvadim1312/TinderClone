import 'react-native-gesture-handler';
import React from 'react';
import {View, StyleSheet} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import MatchesScreen from './src/screens/MatchesScreen';

const App = () => {
  return (
    <View style={styles.pageContainer}>
      <MatchesScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
});

export default App;
