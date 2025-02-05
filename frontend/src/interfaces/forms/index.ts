import { TNameSignFormControl } from "@/types";
import { FormEvent } from "react";

export interface ISignFormControls {
  name: TNameSignFormControl;
  label: string;
  placeholder: string;
  type: string;
  componentType: string;
}
export interface IinitialSignInFormData {
  userEmail: string;
  password: string;
}
export interface IinitialSignUpFormData {
  userName: string;
  userEmail: string;
  password: string;
}

export interface IFormControl {
  formControls: ISignFormControls[] | [];
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export interface ICommonForm {
  handleSubmit: (event: FormEvent) => Promise<void>;
  buttonText: string;
  formControls: ISignFormControls[] | [];
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isButtonDisabled: boolean;
}
