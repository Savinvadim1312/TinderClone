import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, SafeAreaView, Image} from 'react-native';
import users from '../../assets/data/users';
import {DataStore, Auth} from 'aws-amplify';
import {Match, User} from '../models';

const MatchesScreen = () => {
  const [matches, setMatches] = useState([]);
  const [me, setMe] = useState(null);

  const getCurrentUser = async () => {
    const user = await Auth.currentAuthenticatedUser();
    console.log('user ', user);

    const dbUsers = await DataStore.query(
      User,
      u => u.sub === user.attributes.sub,
    );
    if (dbUsers.length < 0) {
      return;
    }
    setMe(dbUsers[0]);
  };

  useEffect(() => getCurrentUser(), []);

  useEffect(() => {
    if (!me) {
      return;
    }
    const fetchMatches = async () => {
      console.log('me: ', me.id);
      const result = await DataStore.query(Match, m =>
        m.or(m1 => m1.User1ID('eq', me.id).User2ID('eq', me.id)),
      );
      console.log('hole');
      console.log(result);
      setMatches(result);
    };
    fetchMatches();
  }, [me]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Text style={{fontWeight: 'bold', fontSize: 24, color: '#F63A6E'}}>
          New Matches
        </Text>
        <View style={styles.users}>
          {matches.map(match => (
            <View style={styles.user} key={match.User1.id}>
              <Image source={{uri: match.User1.image}} style={styles.image} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flex: 1,
    padding: 10,
  },
  container: {
    padding: 10,
  },
  users: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  user: {
    width: 100,
    height: 100,
    margin: 10,
    borderRadius: 50,

    borderWidth: 2,
    padding: 3,
    borderColor: '#F63A6E',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
});

export default MatchesScreen;
