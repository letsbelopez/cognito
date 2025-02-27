import { render } from '@testing-library/react';

import ReactCognito from './react-cognito';

describe('ReactCognito', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ReactCognito />);
    expect(baseElement).toBeTruthy();
  });
});
