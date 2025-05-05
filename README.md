# GitHub Action for Deckrun

Use `deck` to manage your [Deckrun](https://deckrun.com) resources.

## Usage

To install the latest version of `deck` and use it in GitHub Actions workflows, [create a Deckrun API token](https://deckrun.com/docs/getting-started/install-deck-cli#step-1-create-an-api-token), [add it as a secret to your repository](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions#creating-encrypted-secrets-for-a-repository), and add the following step to your workflow:

```yaml
    - name: Install deck
      uses: deckrun/setup-deck@v1
      with:
        token: ${{ secrets.DECKRUN_API_TOKEN }}
```

`deck` will now be available in the virtual environment and can be used directly in the following steps.

As an example, you could deploy the application using Deckrun:

```yaml
    - name: Deploy Application
      run: deck deploy
```

### Arguments

- `token` – (**Required**) A Deckrun API token
- `version` – (Optional) The version of `deck` to install. If excluded, the latest release will be used.

## License

This GitHub Action and associated scripts and documentation in this project are released under the [MIT License](LICENSE).

This repository is based on [GitHub doctl Action](https://github.com/digitalocean/action-doctl)
