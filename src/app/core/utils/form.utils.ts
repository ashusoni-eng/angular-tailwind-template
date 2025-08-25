import {FormGroup} from '@angular/forms';
import {SignupCredentials} from '../interfaces/signup-credentials';

type FieldNameMap = {
  [key: string]: string;
};

export function formatFieldName<T extends string>(fieldName: T,  customMappings: FieldNameMap = {}): string {
  if (fieldName in customMappings) {
    return customMappings[fieldName];
  }
  return fieldName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export function formErrorMessage<T extends string>(fieldName: T, form: FormGroup, formErrors: { [key: string]: string } = {}): string {
  const field = form.get(fieldName);
  if (formErrors[fieldName]) {
    return formErrors[fieldName];
  }

  if (field?.errors) {
    if (field.errors['required']) {
      return `${formatFieldName(fieldName)} is required`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['country_id']) {
      return 'Please select your country';
    }
    if (field.errors['minlength']) {
      return `${formatFieldName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `${formatFieldName(fieldName)} must be at max ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['pattern']) {
      return `Please enter a valid ${formatFieldName(fieldName)} `;
    }
  }

  return '';
}

export function formPasswordErrorMessage<T extends string>(fieldName: T, form: FormGroup, formErrors: { [key: string]: string } = {}): string {
  const field = form.get(fieldName);
  if (formErrors[fieldName]) {
    return formErrors[fieldName];
  }

  if (field?.errors) {
    if (field.errors['required']) {
      return `${formatFieldName(fieldName)} is required`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['tel_cell']) {
      return 'Please enter your Mobile Number';
    }
    if (field.errors['country_id']) {
      return 'Please select your country';
    }
    if (field.errors['minlength']) {
      return `${formatFieldName(fieldName)} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) {
      return `${formatFieldName(fieldName)} must be at max ${field.errors['maxlength'].requiredLength} characters`;
    }
    if (field.errors['pattern']) {
      return `Enter a strong ${formatFieldName(fieldName)}  (A-Z, a-z, 0-9, @# etc.)`;
    }


  }

  return '';
}

export function isFormFieldInvalid<T extends string>(fieldName: T, form: FormGroup): boolean {
  const field = form.get(fieldName);
  return field ? field.invalid && (field.dirty || field.touched) : false;
}


export function  getSelectedProvince(licenseNumber: string, form?: FormGroup): string {
    if (!licenseNumber) return "Unknown";
    licenseNumber = licenseNumber.toUpperCase().trim();
    let selectedProvince = "";
    // only last two char fetch
    const suffix = licenseNumber.slice(-2);
    const provinceMap: Record<string, string> = {
      GP: "Gauteng",
      NW: "North West",
      MP: "Mpumalanga",
      L: "Limpopo",
      FS: "Free State",
      KZN: "KwaZulu-Natal",
      EC: "Eastern Cape",
      NC: "Northern Cape",
      WC: "Western Cape",
    };

    if (provinceMap[suffix]) {
      selectedProvince = provinceMap[suffix];
      if(form){
        form.get("province")?.patchValue(selectedProvince);
      }      
      return selectedProvince;
    }

    const prefixMap: Record<string, string> = {
      C: "Western Cape", // covers CA,CB,CJ
      ND: "KwaZulu-Natal",
      NP: "KwaZulu-Natal",
      PE: "Eastern Cape",
      B: "Eastern Cape",
      M: "Eastern Cape",
    };
    
    // for (const prefix in prefixMap) {
    //   if (licenseNumber.startsWith(prefix)) {
    //     selectedProvince = prefixMap[prefix];
    //     this.vehicleForm.get("province")?.patchValue(selectedProvince);
    //     return selectedProvince;
    //   }
    // }

    for(const length of [3,2,1]){
      const suffix = licenseNumber.slice(-length);
      if (provinceMap[suffix]) {
         const selectedProvince = provinceMap[suffix];
          if(form){
            form.get("province")?.patchValue(selectedProvince);
          }
          return selectedProvince;
      }
    }

    selectedProvince = "Gauteng";
    if(form){
      form.get("province")?.patchValue(selectedProvince);
    }
    return selectedProvince;
  }