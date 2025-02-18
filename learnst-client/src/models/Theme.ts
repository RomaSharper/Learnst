export interface Theme {
    name: string;
    premium: boolean;
    primaryColor: string;
    surfaceColor: string;
    onPrimaryColor: string;
    textColor: string;
    borderColor: string;
    shadowColor: string;
    hoverBg: string;
    activeBg: string;
    focusBorder: string;
    gradient: string;
    type: 'light' | 'dark';
  }
