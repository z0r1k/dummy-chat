<?php

namespace common\assets;

use Yii;
use yii\helpers\Url;
use yii\web\View;
use common\helpers\view\AssetHelper;

class RequireJSConfigAsset extends BasicMainAsset
{
    public $sourcePath = '@common/web';

    public $css = [];
    public $js = [];

    public $depends = [
        'common\assets\CoreAsset',
        'common\assets\RequireJSAsset',
    ];

    public function init()
    {
        $config = [
            'waitSeconds' => 20,
            'nodeIdCompat' => true,
            'urlArgs' => 'bust=' . time(),
            'enforceDefine' => true,
            'baseUrl' => AssetHelper::getAssetBundle('CoreAsset')->baseUrl . '/js/',
            'paths' => [
                'tc' => 'testcenter',
                'mr' => 'meeting-room/app',
                'tpl' => Url::to(['/dashboard/meeting-room/template', 'name' => '']),
                'tokbox' => 'https://static.opentok.com/v2/js/opentok.min',
                'text' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/text/text',
                'handlebars' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/handlebars/handlebars.amd.min',
                'npo' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/native-promise-only/lib/npo.src',
                'adapter' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/webrtc-adapter/adapter',
                'dropzone' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/dropzone/dist/min/dropzone.min',
                'alertify' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/alertify-js/build/alertify.min',
                'socket' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/socket.io-client/dist/socket.io.min',
                'linkify-html' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/linkifyjs/linkify-html.amd.min',
                'linkify' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/linkifyjs/linkify.amd.min',
                'fetch' => AssetHelper::getAssetBundle('RequireJSAsset')->baseUrl . '/fetch/fetch',
            ],
            'shim' => [
                'tokbox' => [
                    'exports' => 'OT',
                ],
                'dropzone' => [
                    'exports' => 'Dropzone',
                ],
                'linkify-html' => [
                    'deps' => ['linkify'],
                ],
                'fetch' => [
                    'exports' => 'fetch',
                    'deps' => ['npo']
                ]
            ]
        ];

        Yii::$app
            ->getView()
            ->registerJs('define("config/components", function(){
                return ' . json_encode($config) . ';
            });', View::POS_HEAD);

        parent::init();
    }
}
