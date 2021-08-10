import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {Auth, DataStore} from 'aws-amplify';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {User} from '../models/';
import {request, PERMISSIONS} from 'react-native-permissions';

const ProfileScreen = () => {
  const [user, setUser] = useState(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState();
  const [lookingFor, setLookingFor] = useState();

  const [newImageLocalUri, setNewImageLocalUri] = useState(null);

  useEffect(() => {
    const perm =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY
        : PERMISSIONS.ANDROID.CAMERA;
    request(perm).then(status => {
      console.log(status);
    });
  }, []);

  useEffect(() => {
    const getCurrentUser = async () => {
      const authUser = await Auth.currentAuthenticatedUser();

      const dbUsers = await DataStore.query(User, u =>
        u.sub('eq', authUser.attributes.sub),
      );

      if (!dbUsers || dbUsers.length === 0) {
        console.warn('This is a new user');
        return;
      }
      const dbUser = dbUsers[0];
      setUser(dbUser);

      setName(dbUser.name);
      setBio(dbUser.bio);
      setGender(dbUser.gender);
      setLookingFor(dbUser.lookingFor);
    };
    getCurrentUser();
  }, []);

  const isValid = () => {
    return name && bio && gender && lookingFor;
  };

  const save = async () => {
    if (!isValid()) {
      console.warn('Not valid');
      return;
    }

    if (user) {
      const updatedUser = User.copyOf(user, updated => {
        updated.name = name;
        updated.bio = bio;
        updated.gender = gender;
        updated.lookingFor = lookingFor;
      });

      await DataStore.save(updatedUser);
    } else {
      // create a new user
      const authUser = await Auth.currentAuthenticatedUser();

      const newUser = new User({
        sub: authUser.attributes.sub,
        name,
        bio,
        gender,
        lookingFor,
        image:
          'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/elon.png',
      });
      await DataStore.save(newUser);
    }

    Alert.alert('User saved successfully');
  };

  const pickImage = () => {
    launchImageLibrary(
      {mediaType: 'mixed'},
      ({didCancel, errorCode, errorMessage, assets}) => {
        if (didCancel || errorCode) {
          console.warn('canceled or error');
          console.log(errorMessage);
          return;
        }
        setNewImageLocalUri(assets[0].uri);
      },
    );
  };

  const signOut = async () => {
    await DataStore.clear();
    Auth.signOut();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView style={styles.container}>
        <Image
          source={{uri: newImageLocalUri ? newImageLocalUri : user?.image}}
          style={{width: 100, height: 100, borderRadius: 50}}
        />
        <Pressable onPress={pickImage}>
          <Text>Change image</Text>
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Name..."
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="bio..."
          multiline
          numberOfLines={3}
          value={bio}
          onChangeText={setBio}
        />

        <Text>Gender</Text>
        <Picker
          label="Gender"
          selectedValue={gender}
          onValueChange={itemValue => setGender(itemValue)}>
          <Picker.Item label="Male" value="MALE" />
          <Picker.Item label="Female" value="FEMALE" />
          <Picker.Item label="Other" value="OTHER" />
        </Picker>

        <Text>Looking for</Text>
        <Picker
          label="Looking for"
          selectedValue={lookingFor}
          onValueChange={itemValue => setLookingFor(itemValue)}>
          <Picker.Item label="Male" value="MALE" />
          <Picker.Item label="Female" value="FEMALE" />
          <Picker.Item label="Other" value="OTHER" />
        </Picker>

        <Pressable onPress={save} style={styles.button}>
          <Text>Save</Text>
        </Pressable>

        <Pressable onPress={signOut} style={styles.button}>
          <Text>Sign out</Text>
        </Pressable>
      </ScrollView>
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
  button: {
    backgroundColor: '#F63A6E',
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 10,
  },
  input: {
    margin: 10,
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1,
  },
});

export default ProfileScreen;
