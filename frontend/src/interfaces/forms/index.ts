import { TNameSignFormControl } from "@/types";

export interface ISignFormControls {
  name: TNameSignFormControl;
  label: string;
  placeholder: string;
  type: string;
  componentType: string;
}
export interface IinitialSignInFormData {
  userEmail: string,
  password: string,
}
export interface IinitialSignUpFormData {
  userName: string,
  userEmail: string,
  password: string,
}
export interface CommonForm {
    handleSubmit,
  buttonText,
  formControls = [],
  formData,
  setFormData,
  isButtonDisabled = false,
}