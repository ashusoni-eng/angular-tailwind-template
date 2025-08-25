/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '90rem',  
      },
      height: {
       h32:'32.5rem',
       h28: '28.125rem'
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'body': ['Inter', 'sans-serif']
      },
      fontSize:{
          9: '9px',
          8: '8px',
        },
        spacing: {
          '50': '50',
        },
      colors: {
        primary: {
          DEFAULT: "#3fa748"
        },        
        secondaryColor: {
          DEFAULT: "#2D3387",  // Main secondary color          
          light: "#4850c2",   // Lighter shade (same as 500)
        },
        red: {
          500: '#FF6F6F',
          100: '#FF6E6E'
        },
        blue: {
          10: '#3A559F',
         600: '#2E94F3',
         500: '#2E94F3'
        },
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00BA00',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          ownertab: '#49BC53'
        },
        gray:{
          10: '#E5E8EC',
          20: '#3A3F44',
          1000: '#F7F9FB',
          100: '#E9ECEF',
          101: '#E6E6E6',
          102: '#818F9E',
          tableHeading: '#898F9A',
          navbar: '#F0F2F3',
          forget: '#232323',
          landingbox: '#F4F6F7',
          footerbg: '#D5DDE5',
          landingtrused: '#E9ECEF7D',
          stepsfont: '#5C5C5D',
          contactborder: '#E6E8E7',
          shadowbox: 'rgb(20 20 20 / 18%)',
          shadowborder: 'rgb(20 20 20 / 7%)',
          shadownav: '#0000000d',
          createOne: '#3A3F44',
          deletepopuptext: '#1C1C1C',
          tableborder: '#1C1C1C33',
          palceholder: '#9A9A9A',
          2000: '#E9ECEFC4'
        },
        black:{
          iconmenu: '#3A3F44',
          100: '#000'
        },
        lightColor: {
           pinkColor: '#FFD6D6',
        },
        border: {
          inputborder: 'rgba(129, 143, 158, 1)'
        },
        spacing: {
          height: '46px'
        },
        textColor:{
          50: '#1C1C1CB2'
        },
        boxBorderColor: {
             darkblue: '#4FA1ED',
             lightred: '#EE5253',
             orange: '#FF9F43',
             lightgreen: '#44BD32',
             darkgreen: '#10AC84',
             lightblue: '#0ABDE380',
             purple: '#192A56',
             mylight: '#0ABDE3'
        },
        tablehead:{
          lightgray: '#E5E8EC',
          textColor: '#3A3F44'
        }
      },

    },
  },
  plugins: [],
}

