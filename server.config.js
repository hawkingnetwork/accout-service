module.exports = {
  apps : [
    {
      name       : 'keypair',
      script     : './bin/www',
      instances  : 1,
      exec_mode  : 'cluster',
      env: {
        'NODE_ENV': 'production',
      },
      env_production : {
         'NODE_ENV': 'production'
      }
    }
    
  ]
}
