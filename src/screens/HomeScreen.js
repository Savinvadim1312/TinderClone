import React, {useState, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';

import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Entypo from 'react-native-vector-icons/Entypo';
import {DataStore, Auth} from 'aws-amplify';
import {User, Match} from '../models';

import Card from '../components/TinderCard';

import AnimatedStack from '../components/AnimatedStack';

const HomeScreen = ({isUserLoading}) => {
  const [users, setUsers] = useState([]);
  const [matchesIds, setMatchesIds] = useState(null); // all user ids of people who we already matched
  const [currentUser, setCurrentUser] = useState(null);
  const [me, setMe] = useState(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const user = await Auth.currentAuthenticatedUser();

      const dbUsers = await DataStore.query(User, u =>
        u.sub('eq', user.attributes.sub),
      );
      if (!dbUsers || dbUsers.length === 0) {
        return;
      }
      setMe(dbUsers[0]);
    };
    getCurrentUser();
  }, [isUserLoading]);

  useEffect(() => {
    if (!me) {
      return;
    }
    const fetchMatches = async () => {
      const result = await DataStore.query(Match, m =>
        m
          .isMatch('eq', true)
          .or(m1 => m1.User1ID('eq', me.id).User2ID('eq', me.id)),
      );
      setMatchesIds(
        result.map(match =>
          match.User1ID === me.id ? match.User2ID : match.User1ID,
        ),
      );
    };
    fetchMatches();
  }, [me]);

  useEffect(() => {
    if (isUserLoading || !me || matchesIds === null) {
      return;
    }
    const fetchUsers = async () => {
      let fetchedUsers = await DataStore.query(User, user =>
        user.gender('eq', me.lookingFor),
      );

      fetchedUsers = fetchedUsers.filter(u => !matchesIds.includes(u.id));

      setUsers(fetchedUsers);
    };
    fetchUsers();
  }, [isUserLoading, me, matchesIds]);

  const onSwipeLeft = () => {
    if (!currentUser || !me) {
      return;
    }

    console.warn('swipe left', currentUser.name);
  };

  const onSwipeRight = async () => {
    if (!currentUser || !me) {
      return;
    }

    const myMatches = await DataStore.query(Match, match =>
      match.User1ID('eq', me.id).User2ID('eq', currentUser.id),
    );
    if (myMatches.length > 0) {
      console.warn('You already swiped right to this user');
      return;
    }

    const hisMatches = await DataStore.query(Match, match =>
      match.User1ID('eq', currentUser.id).User2ID('eq', me.id),
    );

    if (hisMatches.length > 0) {
      const hisMatch = hisMatches[0];
      DataStore.save(
        Match.copyOf(hisMatch, updated => (updated.isMatch = true)),
      );
      return;
    }

    console.warn('Sending him a match request!');
    const newMatch = new Match({
      User1ID: me.id,
      User2ID: currentUser.id,
      isMatch: false,
    });
    console.log(newMatch);
    DataStore.save(newMatch);
  };

  console.log(users);

  return (
    <View style={styles.pageContainer}>
      <AnimatedStack
        data={users}
        renderItem={({item}) => <Card user={item} />}
        setCurrentUser={setCurrentUser}
        onSwipeLeft={onSwipeLeft}
        onSwipeRight={onSwipeRight}
      />
      <View style={styles.icons}>
        <View style={styles.button}>
          <FontAwesome name="undo" size={30} color="#FBD88B" />
        </View>

        <View style={styles.button}>
          <Entypo name="cross" size={30} color="#F76C6B" />
        </View>

        <View style={styles.button}>
          <FontAwesome name="star" size={30} color="#3AB4CC" />
        </View>

        <View style={styles.button}>
          <FontAwesome name="heart" size={30} color="#4FCC94" />
        </View>

        <View style={styles.button}>
          <Ionicons name="flash" size={30} color="#A65CD2" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: '100%',
    backgroundColor: '#ededed',
  },
  icons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 10,
  },
  button: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 50,
  },
});

export default HomeScreen;
