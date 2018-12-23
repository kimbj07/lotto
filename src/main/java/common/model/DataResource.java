package common.model;

import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "dataResource")
@XmlAccessorType(XmlAccessType.FIELD)
public class DataResource {
    @XmlElement(name = "statisticsFileName")
    private String statisticsFileName;

    @XmlElement(name = "logDir")
    private String logDir;

    public String getStatisticsFileName() {
        return statisticsFileName;
    }

    public void setStatisticsFileName(String statisticsFileName) {
        this.statisticsFileName = statisticsFileName;
    }

    public String getLogDir() {
        return logDir;
    }

    public void setLogDir(String logDir) {
        this.logDir = logDir;
    }

    public String getStatisticsFileFullPath() {
        return logDir + statisticsFileName;
    }
}
