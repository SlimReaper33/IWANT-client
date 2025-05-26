import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#C3947A',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
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
    marginTop: 10,
    fontSize: 14,
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  info: {
    color: '#B3E283',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#EEE',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  secondaryText: {
    color: '#C3947A',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    color: 'green', 
    textAlign: 'center', 
    marginBottom: 10
  },
});
