// Global type shims to quiet problematic third-party typings
// Avoid editing node_modules; provide ambient declarations instead.

declare module 'invariant' {
  const invariant: (condition: any, message?: string) => void;
  export default invariant;
}

declare module '@react-native-community/datetimepicker' {
  import * as React from 'react';
    import { ViewProps } from 'react-native';

  export type AndroidMode = 'date' | 'time' | 'datetime' | 'countdown';
  export type Display = 'default' | 'spinner' | 'compact' | 'inline' | 'clock' | 'calendar';

  export interface DateTimePickerEvent {
    type: 'set' | 'dismissed';
    nativeEvent: { timestamp: number };
  }

  export interface RNDateTimePickerProps extends ViewProps {
    value: Date;
    mode?: AndroidMode | 'date' | 'time';
    display?: Display;
    minimumDate?: Date;
    maximumDate?: Date;
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    minuteInterval?: number;
    timeZoneOffsetInMinutes?: number;
    locale?: string;
    testID?: string;
  }

  export const DateTimePickerAndroid: {
    open: (options: Omit<RNDateTimePickerProps, 'onChange' | 'value'> & {
      value: Date;
      onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    }) => void;
    dismiss: () => void;
  };

  export const RNDateTimePicker: React.ComponentType<RNDateTimePickerProps>;
  const DefaultExport: React.ComponentType<RNDateTimePickerProps>;
  export default DefaultExport;
}