


import {
    FormField,
    FormItem,
    FormControl,
    FormMessage,
    FormLabel,
  } from "./ui/form";
  
  import { Control, FieldValues, Path } from "react-hook-form";
  
  interface CustomFieldProps<T extends FieldValues> {
    control: Control<T>;
    render: (field: any) => React.ReactNode;
    name: Path<T>;
    formLabel?: string;
    className?: string;
    para?: string;
  }
  
  
  
  export const CustomField = <T extends FieldValues>({
      control,
      render,
      name,
      formLabel,
      className,
      para
    }: CustomFieldProps<T>) => {
    return (
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className={className}>
            {formLabel && <FormLabel className="text-white text-[18px] ">{formLabel}</FormLabel>}
            <FormControl>{render({ field })}</FormControl>
            <FormMessage />
            {para && <h1 className="text-blue w-full">{para}</h1>}
          </FormItem>
        )}
      />
    );
  };