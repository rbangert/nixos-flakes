https://go.advisorpositions.com/l/997501/2022-09-05/ht
Form
```
<!DOCTYPE html>
<html>2
	<head>
		<base href="" >
		<meta charset="utf-8"/>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
		<meta name="description" content="%%description%%"/>
		<title>%%title%%</title>
	</head>
	<body>
		%%content%%
	</body>
</html>

```

Layout
```
<form accept-charset="UTF-8" method="post" action="%%form-action-url%%" class="form" id="pardot-form">
%%form-opening-general-content%%

%%form-if-thank-you%%
	%%form-javascript-focus%%
	%%form-thank-you-content%%
	%%form-thank-you-code%%
%%form-end-if-thank-you%%

%%form-if-display-form%%

	%%form-before-form-content%%
		%%form-if-error%%
			<p class="errors">Please correct the errors below:</p>
		%%form-end-if-error%%

		%%form-start-loop-fields%%
			<p class="form-field %%form-field-css-classes%% %%form-field-class-type%% %%form-field-class-required%% %%form-field-class-hidden%% %%form-field-class-no-label%% %%form-field-class-error%% %%form-field-dependency-css%%">
				%%form-if-field-label%%
					<label class="field-label" for="%%form-field-id%%">%%form-field-label%%</label>
				%%form-end-if-field-label%%

				%%form-field-input%%
				%%form-if-field-description%%
					<span class="description">%%form-field-description%%</span>
				%%form-end-if-field-description%%
			</p>
			<div id="error_for_%%form-field-id%%" style="display:none"></div>
			%%form-field-if-error%%
				<p class="error no-label">%%form-field-error-message%%</p>
			%%form-field-end-if-error%%
		%%form-end-loop-fields%%

		%%form-spam-trap-field%%

		<!-- forces IE5-8 to correctly submit UTF8 content  -->
		<input name="_utf8" type="hidden" value="&#9731;" />

		<p class="submit">
			<input type="submit" accesskey="s" value="%%form-submit-button-text%%" %%form-submit-disabled%%/>
		</p>
	%%form-after-form-content%%

%%form-end-if-display-form%%

%%form-javascript-link-target-top%%
</form>

```


Site Search
```
<form method="get" action="%%search-action-url%%" class="form" id="pardot-form">
	<p class="full-width">
		<input type="text" name="q" value="%%search-query%%" size="40" />
		<input type="submit" value="Search" />
	</p>
<h2>Search results for: %%search-query%%</h2>

%%search-if-results%%
	<ol start="%%search-result-start-position%%">
		%%search-start-loop-results%%
		<li>
			<strong><a href="%%search-result-url%%">%%search-result-title%%</a></strong><br/>
			%%search-result-description%%<br/>
			<em>%%search-result-url-abbreviation%%</em> %%search-result-file-size%% KB
		</li>
		%%search-end-loop-results%%
	</ol>

	<p class="pager">
		<strong>
		%%search-if-previous-page-available%%
		<a href="%%search-previous-page-url%%">
			Previous (page %%search-previous-page-number%%)
		</a>
		%%search-else-previous-page-not-available%%
			Previous
		%%search-end-if-previous-page-available%% |

		Page %%search-this-page-number%% of %%search-total-pages-number%% |

		%%search-if-next-page-available%%
			<a href="%%search-next-page-url%%">
			Next (page %%search-next-page-number%%)</a>
		%%search-else-next-page-not-available%%
			Next
		%%search-end-if-next-page-available%%
		</strong>
	</p>
%%search-else-no-results%%
	%%search-no-results-content%%
%%search-end-if-results%%
</form>

```