import { X } from 'lucide-react';
import React from 'react';

const XButton = ({ goBack }: { goBack: () => void }) => (
  <button
    className="x-button"
    title="Go back"
    onClick={() => {
      goBack();
    }}
  >
    <X size={24} />
  </button>
);

export const Form = ({ message, inputs, goBack }: { message: string; inputs: React.ReactNode[]; goBack: () => void }) => {
    return (
      <>
        <div className="overlay">
          <form className="form">
            <div className="flex justify-between">
              <p className="title">Register </p>
              <XButton goBack={goBack} />
            </div>
            <p className="message">
                {message}
            </p>
            {inputs}
            <button className="submit">Submit</button>
          </form>
        </div>

        <style jsx>{`
          .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }

          .form {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
            background-color: #fff;
            padding: 20px;
            border-radius: 20px;
            position: relative;
          }
  
          .title {
            font-size: 28px;
            color: royalblue;
            font-weight: 600;
            letter-spacing: -1px;
            position: relative;
            display: flex;
            align-items: center;
            padding-left: 30px;
          }
  
          .title::before,
          .title::after {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            border-radius: 50%;
            left: 0px;
            background-color: royalblue;
          }
  
          .title::before {
            width: 18px;
            height: 18px;
            background-color: royalblue;
          }
  
          .title::after {
            width: 18px;
            height: 18px;
            animation: pulse 1s linear infinite;
          }
  
          .message,
          .signin {
            color: rgba(88, 87, 87, 0.822);
            font-size: 14px;
          }
  
          .signin {
            text-align: center;
          }
  
          .signin a {
            color: royalblue;
          }
  
          .signin a:hover {
            text-decoration: underline royalblue;
          }
  
          .flex {
            display: flex;
            width: 100%;
            gap: 6px;
          }
  
          .submit {
            border: none;
            outline: none;
            background-color: royalblue;
            padding: 10px;
            border-radius: 10px;
            color: #fff;
            font-size: 16px;
            transform: 0.3s ease;
          }
  
          .submit:hover {
            background-color: rgb(56, 90, 194);
          }
  
          @keyframes pulse {
            from {
              transform: scale(0.9);
              opacity: 1;
            }
  
            to {
              transform: scale(1.8);
              opacity: 0;
            }
          }
        `}</style>
      </>
    );
  };
