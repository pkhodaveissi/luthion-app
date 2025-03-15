"use client";
import Login from '@/components/Login';
import React from 'react'
import { ThemeProvider, createTheme } from '@aws-amplify/ui-react';
import { colorObj } from '@/tailwind.config';

const theme = createTheme({
  name: 'base-luthion-theme',
  tokens: {
    fonts: {
      default: {
        variable: { value: 'Raleway, sans-serif' },
        static: { value: 'Raleway, sans-serif' },
      },
    },
    components: {
      heading: {
        color: colorObj.colors.text.secondary,
      },
      authenticator: {
        router: {
          backgroundColor: { value: colorObj.colors.background },
          borderColor: { value: 'transparent' },
          boxShadow: { value: colorObj.boxShadow.border },
        },
      },
      passwordfield: {
        button: {
          color: colorObj.colors.text.primary,
        }
      },
      field: {
       label: {
        color: colorObj.colors.text.secondary,
       }
      },
      button: {
        fontWeight: {
          value: '600',
        },
        primary: {
          backgroundColor: colorObj.colors.surface,
          _hover: {
            backgroundColor: colorObj.colors.surface,
            borderColor: colorObj.colors.border,
          },
          _active: {
            backgroundColor: colorObj.colors.surface,
            borderColor: colorObj.colors.border,
          },
          _focus: {
            backgroundColor: colorObj.colors.surface,
            borderColor: colorObj.colors.border,
          }
        },
        link: {
          color: colorObj.colors.text.secondary,
          _hover: {
            color: colorObj.colors.text.secondary,
            backgroundColor: colorObj.colors.surface,
            borderColor: colorObj.colors.border,
          },
          _active: {
            color: colorObj.colors.text.secondary,
            backgroundColor: colorObj.colors.surface,
            borderColor: colorObj.colors.border,
          },
          _focus: {
            color: colorObj.colors.text.secondary,
            backgroundColor: colorObj.colors.surface,
            borderColor: colorObj.colors.border,
          }
        },
      },
      tabs: {
        item: {
          color: colorObj.colors.text.muted,
          borderColor: colorObj.colors.surface,
          _active: {
            borderColor: colorObj.colors.text.primary,
            color: colorObj.colors.text.primary,
          },
          _hover: {
            color: colorObj.colors.text.primary,
            borderColor: colorObj.colors.text.primary,
          }
        },
      },
    },
  },
});

const Page = () => {
  return (
    <div>
      <ThemeProvider theme={theme}>
        <Login />
      </ThemeProvider>
    </div>
  )

}

export default Page;