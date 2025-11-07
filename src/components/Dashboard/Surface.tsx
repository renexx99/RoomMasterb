import {, Box, BoxProps, polymorphic } from '@mantine/core';

const Surface = polymorphic<"div", BoxProps>(function Surface(
  { style, ...others },
  ref,
) {
  return (
    <Box
      ref={ref}
      style={[
        (theme) => ({
          padding: theme.spacing.md,
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          borderRadius: theme.radius.md,
          border: `1px solid ${
            theme.colorScheme === 'dark'
              ? theme.colors.dark[6]
              : theme.colors.gray[2]
          }`,
        }),
        ...(Array.isArray(style) ? style : [style]),
      ]}
      {...others}
    />
  );
});

export default Surface;