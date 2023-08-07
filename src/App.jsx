import './App.css';
import { useState, useRef } from 'react';
import Toastify, { successToast } from './components/Toast/Toastify';
import Modal from './components/Modal/Modal';
import NoBalance from './components/NoBalance/NoBalance';
import Header from './components/Header/Header';
import CurrentBalance from './components/CurrentBalance/CurrentBalance';
import { debounce } from './utils/debounce';
import Form from './components/Form/Form';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

function App() {
  const [currentBalance, setCurrentBalance] = useState(10000);
  const [spinnerStatus, setSpinnerStatus] = useState(false);

  const schema = Yup.object().shape({
    address: Yup.string()
      .required('Ethereum address is required')
      .test(
        'is-valid-ethereum-address',
        'Invalid Ethereum address',
        (address) => /^0x[a-fA-F0-9]{40}$/.test(address)
      ),
    tokens: Yup.number()
      .typeError('Amount of tokens must be a number')
      .required('Amount of tokens is required')
      .positive('Amount of tokens must be positive')
      .integer('Amount of tokens must be an integer')
      .max(currentBalance)
      .test(
        'is-available-tokens',
        'Insufficient balance',
        (tokens) => tokens <= currentBalance
      ),
    range: Yup.number().required('Range is required'),
  });

  const {
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      address: '',
      tokens: '',
      range: 0,
    },

    resolver: yupResolver(schema),
    mode: 'onTouched',
  });

  function delaySpinner(status, delayTime) {
    return new Promise((resolve) =>
      setTimeout(() => resolve(setSpinnerStatus(status)), delayTime)
    );
  }

  // function handlers
  const onSubmit = async (data) => {
    const tokensAmount = getValues('tokens');
    if (tokensAmount <= 0) {
      trigger(['address', 'range', 'tokens']);
      return;
    }
    if (currentBalance < tokensAmount) {
      trigger(['address', 'range', 'tokens']);
      return;
    }
    await delaySpinner(true, 500);
    await delaySpinner(false, 3000);
    setCurrentBalance(currentBalance - tokensAmount);
    successToast();
    reset();
    console.log(data);
  };

  const timer = useRef();

  const handleTokensChange = (value) => {
    if (value > currentBalance) {
      setValue('range', currentBalance);
      setValue('tokens', currentBalance);
      return;
    }
    setValue('range', value);
    setValue('tokens', value);
    debounce(timer, trigger, 'tokens', 500);
  };

  const handleRangeChange = (event) => {
    setValue('tokens', event.target.value);
    setValue('range', event.target.value);
    debounce(timer, trigger, 'tokens', 500);
  };

  return (
    <div>
      <Toastify />
      {spinnerStatus && <Modal />}
      <Header />
      {currentBalance ? (
        <CurrentBalance currentBalance={currentBalance} />
      ) : (
        <NoBalance setCurrentBalance={setCurrentBalance} />
      )}
      <Form
        onSubmit={onSubmit}
        handleTokensChange={handleTokensChange}
        handleRangeChange={handleRangeChange}
        handleSubmit={handleSubmit}
        control={control}
        watch={watch}
        errors={errors}
        currentBalance={currentBalance}
        getValues={getValues}
      />
    </div>
  );
}

export default App;
