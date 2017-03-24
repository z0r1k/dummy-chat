<?php
/**
 * @version $Revision: 16369 $
 */

/**
 * Length of symbols to use for version tag
 */
define("SHORTHAND_LENGTH", 7);

/**
 * Static files version handling class
 */
class VersionMap {
    /**
     * @var Config
     */
    protected $_config;
    /**
     * @param Config $config
     */
    public function __construct(Config $config){
        $this->_config = $config;
        $this->appRoot = isset($_ENV["GPROOT"]) ? $_ENV["GPROOT"] : $this->_config->APPROOT;
        $this->_config->path = realpath($this->_config->path);
    }
    /**
     * Update project version map files
     */
    public function update(){
        if ("games" === $this->_config->type) {
            $this->updateAssets();
        } else {
            $this->updateG();
        }
    }
    /**
     * Update G project version map files
     */
    public function updateG(){
        $globalVersion = $this->_getGlobalRevision($this->_config->path);
        $versions = $this->_getRevisions($this->_config->path);

        // to keep version maps updated their version set to global revision
        $versions[$this->_config->path_versions] = $globalVersion;
        $versions[$this->_config->path_versions_www] = $globalVersion;

        // get www public files versions
        $versionsWww = $this->_filterWww($versions);

        // save versions map
        $pathVersions = $this->appRoot . $this->_config->path_versions;
        $this->_saveVersions($versions, $pathVersions);

        // save www versions map
        $pathVersionsWww = $this->appRoot . $this->_config->path_versions_www;
        $this->_saveVersions($versionsWww, $pathVersionsWww, $this->_config->template);
    }
    /**
     * Update games version map file
     */
    public function updateAssets(){
        $globalRevision = $this->_getGlobalRevision($this->_config->path);
        $versions = $this->_getRevisions($this->_config->path);

        // to keep version maps updated their version set to global revision
        $versions[$this->_config->path_versions_games] = $globalRevision;
        $versions[$this->_config->path_versions_www_games] = $globalRevision;

        // save versions map
        $pathVersions = $this->appRoot . $this->_config->path_versions_games;
        $this->_saveVersions($versions, $pathVersions);

        // save games versions map
        $pathVersionsAssets = $this->appRoot . $this->_config->path_versions_www_games;
        $this->_saveVersions($versions, $pathVersionsAssets, $this->_config->template_games);
    }
    /**
     * @param array $versions
     * @param string $filename
     * @param string|NULL $tpl
     * @throws Exception
     */
    protected function _saveVersions(array $versions, $filename, $tpl = null){
        $content = json_encode($versions);
        if ($tpl) {
            $content = sprintf($tpl, $content);
        }

        $r = file_put_contents($filename, $content);
        if (false === $r) {
            throw new Exception("Failed writing {$filename}");
        }
    }
    /**
     * @param array $revisions
     * @return array
     */
    protected function _filterWww(array $revisions){
        $result = array();

        foreach ($revisions as $path => $revision) {
            foreach ($this->_config->dir_www as $dir) {
                $search = $dir;
                $l = strlen($search);

                if (!strncmp($search, $path, $l)) {
                    $path = substr($path, $l);
                    $result[$path] = $revision;
                    continue(2);
                }
            }
        }

        return $result;
    }
    /**
     * @param string $cmd
     * @return string
     * @throws Exception
     */
    protected function _exec($cmd){
        $o = null;
        $r = null;
        exec($cmd, $o, $r);
        if ($r) {
            throw new Exception("Failed executing: " . $cmd);
        }
        return implode($o);
    }
    /**
     * Get SHA-1 based shorthand (7 characters) version tag
     * @param string $path
     * @return string
     */
    protected function _getGlobalRevision($path){
        return substr(sha1($path), 0, SHORTHAND_LENGTH);
    }
    /**
     * Get map of paths and SHA-1 based shorthand (7 characters) version tags
     * @param string $path
     * @return array
     * @throws exception
     */
    protected function _getRevisions($path){
        $revisions = array();

        if ("/" !== $path[strlen($path) - 1]) {
            $path = $path . "/";
        }

        try {
            $rootDir = new RecursiveDirectoryIterator($path);
            foreach (new RecursiveIteratorIterator($rootDir) as $filename => $fileObj) {
                if ($fileObj->isDir()) {
                    continue;
                }

                $filePath = str_replace($path, "", $filename);
                foreach ($this->_config->dir_exclude as $dir) {
                    if (0 === strncmp($dir, $filePath, strlen($dir))) {
                        continue(2);
                    }
                }

                // resolve symlink and check is it valid
                $absFilename = realpath($filename);
                if ($absFilename) {
                    $revision = substr(sha1_file($absFilename), 0, SHORTHAND_LENGTH);
                    $revisions[str_replace($path, "", $filename)] = $revision;
                }
            }
        } catch (Exception $e) {
            throw new Exception("Failed to get revisions: " . $e->getMessage());
        }

        return $revisions;
    }
}