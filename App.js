import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';


import LoginPage from './screens/loginView';

export default function App() {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='FrontPage'>
        <Stack.Screen
          name='loginPage'
          component={LoginPage}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}