
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        grunticon: {
            myIcons: {
                files: [{
                    expand: true,
                    cwd: 'intelligram/images',
                    src: ['*.svg'],
                    dest: "intelligram/grunticon"
                }],
                options: {
                    cssprefix: '.',
                    compressPNG: true,
                    defaultWidth: 144,
                    defaultHeight: 144,
                    enhanceSVG: true,
                    loadersnippet: "grunticon.loader.js"
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-grunticon');
    grunt.registerTask('default', ['grunticon:myIcons']);
};