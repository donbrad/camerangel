module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        grunticon: {
            myIcons: {
                files: [{
                    expand: true,
                    cwd: 'images',
                    src: ['*.svg'],
                    dest: "grunticon"
                }],
                options: {
                    cssprefix: '.',
                    compressPNG: true,
                    enhanceSVG: true,
                    loadersnippet: "grunticon.loader.js"
                }
            }
        }
    });
    grunt.loadNpmTasks('grunt-grunticon');
    grunt.registerTask('default', ['grunticon:myIcons']);
};