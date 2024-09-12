/**
 * WordPress dependencies
 */
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useState, useMemo } from '@wordpress/element';
import { useEntityRecords, useEntityProp } from '@wordpress/core-data';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AllPatterns from './all-patterns';
import SelectedPattern from './selected-pattern';
import Header from './header';
import './style.scss';

const test = {
	id: 39925,
	date: '2024-09-06T16:37:08',
	date_gmt: '2024-09-06T16:37:08',
	guid: {
		rendered: 'http://twitchstreams.local/schema/jobposting/',
		raw: 'http://twitchstreams.local/schema/jobposting/',
	},
	modified: '2024-09-06T16:37:08',
	modified_gmt: '2024-09-06T16:37:08',
	password: '',
	slug: 'jobposting',
	status: 'publish',
	type: 'schema',
	link: 'http://twitchstreams.local/schema/jobposting/',
	title: {
		raw: 'JobPosting',
		rendered: 'JobPosting',
	},
	content: {
		raw: '',
		rendered: '',
		protected: false,
		block_version: 0,
	},
	template: '',
	meta: {
		enabled: true,
	},
	property: [
		10057, 10056, 10677, 10662, 10657, 10666, 10461, 10058, 10676, 10052,
		10674, 10673, 10663, 10654, 10650, 10670, 10659, 10661, 10680, 10060,
		10059, 10671, 10660, 10664, 10652, 10651, 10683, 10678, 10658, 10055,
		10063, 10397, 10665, 10061, 10675, 10682, 10653, 10667, 10062, 10672,
		10655, 10656, 10681, 10054, 10669, 10668, 10053, 10519, 10679,
	],
	permalink_template: 'http://twitchstreams.local/schema/%pagename%/',
	generated_slug: 'jobposting',
	class_list: [
		'post-39925',
		'schema',
		'type-schema',
		'status-publish',
		'hentry',
		'property-schemaadditionaltype',
		'property-schemaalternatename',
		'property-schemaapplicantlocationrequirements',
		'property-schemaapplicationcontact',
		'property-schemabasesalary',
		'property-schemabenefits',
		'property-schemadateposted',
		'property-schemadescription',
		'property-schemadirectapply',
		'property-schemadisambiguatingdescription',
		'property-schemaeducationrequirements',
		'property-schemaeligibilitytoworkrequirement',
		'property-schemaemployeroverview',
		'property-schemaemploymenttype',
		'property-schemaemploymentunit',
		'property-schemaestimatedsalary',
		'property-schemaexperienceinplaceofeducation',
		'property-schemaexperiencerequirements',
		'property-schemahiringorganization',
		'property-schemaidentifier',
		'property-schemaimage',
		'property-schemaincentivecompensation',
		'property-schemaincentives',
		'property-schemaindustry',
		'property-schemajobbenefits',
		'property-schemajobimmediatestart',
		'property-schemajoblocation',
		'property-schemajoblocationtype',
		'property-schemajobstartdate',
		'property-schemamainentityofpage',
		'property-schemaname',
		'property-schemaoccupationalcategory',
		'property-schemaphysicalrequirement',
		'property-schemapotentialaction',
		'property-schemaqualifications',
		'property-schemarelevantoccupation',
		'property-schemaresponsibilities',
		'property-schemasalarycurrency',
		'property-schemasameas',
		'property-schemasecurityclearancerequirement',
		'property-schemasensoryrequirement',
		'property-schemaskills',
		'property-schemaspecialcommitments',
		'property-schemasubjectof',
		'property-schematitle',
		'property-schematotaljobopenings',
		'property-schemaurl',
		'property-schemavalidthrough',
		'property-schemaworkhours',
	],
	_links: {
		self: [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/schema/39925',
				targetHints: {
					allow: [ 'GET', 'POST', 'PUT', 'PATCH', 'DELETE' ],
				},
			},
		],
		collection: [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/schema',
			},
		],
		about: [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/types/schema',
			},
		],
		'wp:attachment': [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/media?parent=39925',
			},
		],
		'wp:term': [
			{
				taxonomy: 'property',
				embeddable: true,
				href: 'http://twitchstreams.local/wp-json/wp/v2/property?post=39925',
			},
		],
		'wp:action-publish': [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/schema/39925',
			},
		],
		'wp:action-unfiltered-html': [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/schema/39925',
			},
		],
		'wp:action-create-property': [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/schema/39925',
			},
		],
		'wp:action-assign-property': [
			{
				href: 'http://twitchstreams.local/wp-json/wp/v2/schema/39925',
			},
		],
		curies: [
			{
				name: 'wp',
				href: 'https://api.w.org/{rel}',
				templated: true,
			},
		],
	},
};

const App = () => {
	const [ selectedPattern, setSelectedPattern ] = useState( null );
	return (
		<>
			<Header
				pattern={ selectedPattern }
				onClick={ setSelectedPattern }
			/>
			{ ! selectedPattern ? (
				<AllPatterns onSelect={ setSelectedPattern } />
			) : (
				<SelectedPattern
					pattern={ selectedPattern }
					onSelect={ setSelectedPattern }
				/>
			) }
		</>
	);
};

export default App;
