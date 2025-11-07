import {
  Box,
  BoxProps,
  createPolymorphicComponent,
  useMantineTheme, // <-- Impor useMantineTheme
  useMantineColorScheme, // <-- Impor useMantineColorScheme
} from '@mantine/core';
import { forwardRef } from 'react';

// 1. Definisikan komponen dasar dengan forwardRef
const _Surface = forwardRef<HTMLDivElement, BoxProps>(
  ({ style, ...others }, ref) => {
    // Ambil theme dan colorScheme menggunakan hook di dalam komponen
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();

    return (
      <Box
        ref={ref}
        style={[
          // Sekarang kita bisa menggunakan 'colorScheme' dan 'theme' di sini
          {
            padding: theme.spacing.md,
            backgroundColor:
              colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
            borderRadius: theme.radius.md,
            border: `1px solid ${
              colorScheme === 'dark'
                ? theme.colors.dark[6]
                : theme.colors.gray[2]
            }`,
          },
          // ...gabungkan dengan style prop yang mungkin dilewatkan
          ...(Array.isArray(style) ? style : [style]),
        ]}
        {...others}
      />
    );
  },
);

// Beri nama display untuk debugging
_Surface.displayName = 'Surface';

// 2. Buat komponen polimorfik
const Surface = createPolymorphicComponent<'div', BoxProps>(_Surface);

export default Surface;