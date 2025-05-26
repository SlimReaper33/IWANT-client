import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C3947A',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#000000',
  },
  button: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: '#C3947A',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#FFFFFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 8,
    fontSize: 14,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
});
