import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  blockOneContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    height: '100%',
  },

  /* Горизонтальные линии (для широких экранов) */
  horizontalLinesContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'column',
    justifyContent: 'space-around',
    pointerEvents: 'none',
  },
  horizontalLineRow: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '33.33%',
  },
  actualLineHorizontal: {
    width: '90%',
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },

  /* Вертикальные линии (для узких экранов) */
  verticalLinesContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    pointerEvents: 'none',
  },
  verticalLineColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '33.33%',
  },
  actualLineVertical: {
    height: '90%',
    width: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },

  /* Шестерёнка в углу */
  headerContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 9999,
  },
  gearIcon: {
    fontSize: 24,
    color: '#FFF',
  },

  /* UI-панель снизу: текст + кнопки */
  uiContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    height: 80,
    justifyContent: 'center',
  },
  pageLabelBottomLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  bottomRightButtonsContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  buttonIcon: {
    fontSize: 18,
    color: '#333',
  },
  inactiveButton: {
    backgroundColor: '#AAA',
    opacity: 0.5,
  },

  /* Кнопка "+" при редактировании */
  editButtonsContainer: {
    position: 'absolute',
    bottom: 60,
    right: 10,
    flexDirection: 'row',
  },
});
