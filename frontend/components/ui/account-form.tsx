import React from "react";
import { FormInput } from "./form-input";
import { Form } from "./form";


export const AccountForm = ({ appName, goBack }: { appName: string; goBack: () => void }) => {

    const inputs = [
        <FormInput type="text" placeholder="User Id" />,
        <FormInput type="password" placeholder="Password" />,
        <FormInput type="password" placeholder="Confirm password" />
    ]

    return (
        <>
            <Form message={`register ${appName} account`} inputs={inputs} goBack={goBack} />
        </>
    )

}
