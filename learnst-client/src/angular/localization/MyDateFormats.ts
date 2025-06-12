import {MatDateFormats} from "@angular/material/core";

export const MY_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'dd.mm.yyyy',
  },
  display: {
    dateInput: 'dd.mm.yyyy',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
