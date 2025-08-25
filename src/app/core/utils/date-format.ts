import { MatDateFormats } from '@angular/material/core';

export const MY_DATE_FORMATS: MatDateFormats = {
    parse: {
        dateInput: 'DD-MM-YYYY',
    },
    display: {
        dateInput: 'DD-MM-YYYY',
        monthYearLabel: 'MMMM YYYY',
        dateA11yLabel: 'DD-MM-YYYY',
        monthYearA11yLabel: 'MMMM YYYY',
    },
};


export function formatDateTime(utcString: string): string {
    const date = new Date(utcString); // parse UTC string

    // Options for date
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Africa/Johannesburg",
    };

    // Options for time
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Africa/Johannesburg",
    };

    const datePart = new Intl.DateTimeFormat("en-GB", dateOptions).format(date);
    const timePart = new Intl.DateTimeFormat("en-US", timeOptions).format(date);

    // Convert DD/MM/YYYY → YYYY-MM-DD
    const [day, month, year] = datePart.split("/");
    return `${year}-${month}-${day} at ${timePart}`;
  }