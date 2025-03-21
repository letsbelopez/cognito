#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

async function main() {
  try {
    // Get version bump type from arguments (default to patch)
    const bumpType = process.argv[2] || 'patch';
    const validBumpTypes = ['patch', 'minor', 'major'];
    
    if (!validBumpTypes.includes(bumpType)) {
      console.error(`Invalid bump type: ${bumpType}. Must be one of: ${validBumpTypes.join(', ')}`);
      process.exit(1);
    }

    console.log(`\n🔄 Step 1: Running version update (${bumpType})...`);
    execSync(`pnpm dlx nx release version ${bumpType}`, { stdio: 'inherit' });

    console.log('\n🔄 Step 2: Updating dependencies...');
    execSync('pnpm install', { stdio: 'inherit' });

    // Get current versions after update
    const corePackage = require(path.join(process.cwd(), 'packages/cognito-core/package.json'));
    const reactPackage = require(path.join(process.cwd(), 'packages/react-cognito/package.json'));
    
    console.log('\n📦 Current package versions:');
    console.log(`  @letsbelopez/cognito-core: ${corePackage.version}`);
    console.log(`  @letsbelopez/react-cognito: ${reactPackage.version}`);

    // Check dependency resolution
    console.log('\n🔗 Dependency check:');
    const resolvedCoreVersion = require(path.join(process.cwd(), 'node_modules/@letsbelopez/react-cognito/package.json'))
      .dependencies['@letsbelopez/cognito-core'];
    console.log(`  @letsbelopez/react-cognito depends on @letsbelopez/cognito-core: ${resolvedCoreVersion}`);
    
    // Check if there's a nested dependency
    const nestedDepPath = path.join(process.cwd(), 'node_modules/@letsbelopez/react-cognito/node_modules/@letsbelopez/cognito-core');
    if (fs.existsSync(nestedDepPath)) {
      const nestedVersion = require(path.join(nestedDepPath, 'package.json')).version;
      console.log(`  ⚠️ Nested dependency found with version: ${nestedVersion}`);
      console.log(`  ⚠️ This may cause issues during publishing!`);
      
      const cleanNested = await question('  Would you like to remove the nested dependency? (y/n): ');
      if (cleanNested.toLowerCase() === 'y') {
        console.log('  🧹 Cleaning nested dependencies...');
        execSync('rm -rf node_modules/@letsbelopez/react-cognito/node_modules', { stdio: 'inherit' });
        console.log('  🔄 Reinstalling dependencies...');
        execSync('pnpm install --force', { stdio: 'inherit' });
        console.log('  ✅ Nested dependencies cleaned.');
      }
    } else {
      console.log('  ✅ No nested dependencies found.');
    }

    // Confirm before publishing
    const confirm = await question('\n⚠️ Ready to publish. Continue? (y/n): ');
    
    if (confirm.toLowerCase() === 'y') {
      console.log('\n📤 Publishing packages...');
      execSync('pnpm dlx nx release publish', { stdio: 'inherit' });
      console.log('\n🎉 Packages published successfully!');
    } else {
      console.log('\n❌ Publishing cancelled.');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
