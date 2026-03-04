import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from './Icon';

interface CalculatorProps {
  onClose?: () => void;
}

type Operation = '+' | '-' | '×' | '÷' | '^' | null;

/**
 * Simple calculator for calculation questions
 * Supports: +, -, ×, ÷, ^ (power)
 */
export function Calculator({ onClose }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }

    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: Operation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const result = calculate(previousValue, inputValue, operation);
      setDisplay(formatResult(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (left: number, right: number, op: Operation): number => {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '×':
        return left * right;
      case '÷':
        return right !== 0 ? left / right : 0;
      case '^':
        return Math.pow(left, right);
      default:
        return right;
    }
  };

  const formatResult = (value: number): string => {
    // Avoid floating point display issues
    const rounded = Math.round(value * 1000000) / 1000000;
    const str = rounded.toString();
    // Limit display length
    if (str.length > 12) {
      return rounded.toExponential(4);
    }
    return str;
  };

  const equals = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (!operation || previousValue === null) return;

    const inputValue = parseFloat(display);
    const result = calculate(previousValue, inputValue, operation);

    setDisplay(formatResult(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const percentage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const value = parseFloat(display) / 100;
    setDisplay(formatResult(value));
  };

  const toggleSign = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const value = parseFloat(display) * -1;
    setDisplay(formatResult(value));
  };

  const renderButton = (
    label: string,
    onPress: () => void,
    style?: 'number' | 'operator' | 'function' | 'equals'
  ) => {
    const buttonStyles = [
      styles.button,
      style === 'operator' && styles.operatorButton,
      style === 'function' && styles.functionButton,
      style === 'equals' && styles.equalsButton,
    ];

    const textStyles = [
      styles.buttonText,
      style === 'operator' && styles.operatorText,
      style === 'function' && styles.functionText,
      style === 'equals' && styles.equalsText,
    ];

    return (
      <Pressable style={buttonStyles} onPress={onPress}>
        <Text style={textStyles}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="calculator" size={16} color="#58A6FF" />
          <Text style={styles.headerTitle}>Calculatrice</Text>
        </View>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={18} color="#8B949E" />
          </Pressable>
        )}
      </View>

      {/* Display */}
      <View style={styles.display}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
        {operation && (
          <Text style={styles.operationIndicator}>{operation}</Text>
        )}
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        <View style={styles.row}>
          {renderButton('C', clear, 'function')}
          {renderButton('±', toggleSign, 'function')}
          {renderButton('%', percentage, 'function')}
          {renderButton('÷', () => performOperation('÷'), 'operator')}
        </View>
        <View style={styles.row}>
          {renderButton('7', () => inputDigit('7'))}
          {renderButton('8', () => inputDigit('8'))}
          {renderButton('9', () => inputDigit('9'))}
          {renderButton('×', () => performOperation('×'), 'operator')}
        </View>
        <View style={styles.row}>
          {renderButton('4', () => inputDigit('4'))}
          {renderButton('5', () => inputDigit('5'))}
          {renderButton('6', () => inputDigit('6'))}
          {renderButton('-', () => performOperation('-'), 'operator')}
        </View>
        <View style={styles.row}>
          {renderButton('1', () => inputDigit('1'))}
          {renderButton('2', () => inputDigit('2'))}
          {renderButton('3', () => inputDigit('3'))}
          {renderButton('+', () => performOperation('+'), 'operator')}
        </View>
        <View style={styles.row}>
          {renderButton('0', () => inputDigit('0'))}
          {renderButton('.', inputDecimal)}
          {renderButton('xʸ', () => performOperation('^'), 'operator')}
          {renderButton('=', equals, 'equals')}
        </View>
      </View>

      {/* Helper text for compound interest */}
      <Text style={styles.helperText}>
        Astuce: Pour les intérêts composés, utilisez xʸ {'\n'}
        Ex: 10000 × 1.07 xʸ 30 = résultat
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#30363D',
    overflow: 'hidden',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#30363D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    fontWeight: '600',
    color: '#58A6FF',
  },
  closeButton: {
    padding: 4,
  },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0D1117',
    minHeight: 64,
  },
  displayText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 32,
    fontWeight: '600',
    color: '#E6EDF3',
    flex: 1,
    textAlign: 'right',
  },
  operationIndicator: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    color: '#58A6FF',
    marginLeft: 8,
  },
  keypad: {
    padding: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    aspectRatio: 1.3,
    backgroundColor: '#21262D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorButton: {
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
  },
  functionButton: {
    backgroundColor: '#30363D',
  },
  equalsButton: {
    backgroundColor: '#39FF14',
  },
  buttonText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 20,
    fontWeight: '600',
    color: '#E6EDF3',
  },
  operatorText: {
    color: '#58A6FF',
  },
  functionText: {
    color: '#8B949E',
  },
  equalsText: {
    color: '#0D1117',
  },
  helperText: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#8B949E',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    lineHeight: 16,
  },
});

export default Calculator;
