class ShippingServiceException extends Error {
  public status: number;
  public errors: Array<unknown>;

  public constructor(message?: string, status = 500, errors: Array<unknown> = []) {
    super(message);

    this.name = 'ShippingServiceException';
    this.status = status;
    this.errors = errors;
  }
}

export default ShippingServiceException;
