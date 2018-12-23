package instame2.error;

@SuppressWarnings("serial")
public class Instame2Exception extends RuntimeException {
    public Instame2Exception() {
        super();
    }

    public Instame2Exception(Exception e) {
        super(e);
    }

    public Instame2Exception(String message) {
        super(message);
    }

    public Instame2Exception(String message, Throwable cause) {
        super(message, cause);
    }
}
