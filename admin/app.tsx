/**
 * WordPress dependencies
 */
import {
	DataViews,
	Field,
	Fields,
	filterSortAndPaginate,
	View,
	ViewTable,
} from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useEntityRecords, useEntityProp, Post } from '@wordpress/core-data';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './styles.scss';

const defaultLayouts = {
	table: {
		layout: {
			primaryField: 'title',
		},
	},
};

const fields: Field< Post >[] = [
	{
		id: 'title',
		label: __( 'Name' ),
		getValue: ( { item }: { item: Post } ) => item.title.rendered,
		enableGlobalSearch: true,
		enableSorting: true,
		enableHiding: false,
	},
	{
		id: 'enabled',
		label: __( 'Status' ),
		elements: [
			{ label: 'Enabled', value: true },
			{ label: 'Disabled', value: false },
		],
		render: ( { item }: { item: Post } ) => {
			const [ meta ] = useEntityProp(
				'postType',
				'schema',
				'meta',
				item.id
			);
			const { editEntityRecord, saveEditedEntityRecord } =
				useDispatch( 'core' );
			return (
				<>
					<CheckboxControl
						checked={ meta?.enabled }
						label={
							meta?.enabled ? __( 'Enabled' ) : __( 'Disabled' )
						}
						onChange={ () => {
							editEntityRecord( 'postType', 'schema', item.id, {
								meta: {
									...meta,
									enabled: ! meta?.enabled,
								},
							} );
							saveEditedEntityRecord(
								'postType',
								'schema',
								item.id
							);
						} }
					/>
				</>
			);
		},
		getValue: ( { item }: { item: Post } ) => {
			return item.meta?.enabled;
		},
		enableSorting: false,
		enableHiding: false,
		filterBy: {
			operators: [ 'is' ],
		},
	},
];

const actions = [];

const App = () => {
	const [ page, setPage ] = useState< number | undefined >( 1 );
	const [ perPage, setPerPage ] = useState< number | undefined >( 10 );
	const [ orderby, setOrderby ] = useState( 'title' );
	const [ order, setOrder ] = useState( 'asc' );
	const [ search, setSearch ] = useState( '' );
	const [ enabled, setEnabled ] = useState();
	// Retrieve the schemas from the store and check if it is resolving.
	const {
		records: schemas,
		isResolving,
		totalItems,
		totalPages,
	} = useEntityRecords( 'postType', 'schema', {
		per_page: perPage,
		page,
		search,
		orderby,
		order,
		// This is a custom thing to allow us to filter by meta.
		enabled,
	} );

	// "view" and "setView" definition.
	const [ view, setView ] = useState< View >( {
		type: 'table',
		perPage: perPage,
		layout: defaultLayouts.table.layout,
		fields: [ 'id', 'enabled', 'title' ],
	} );

	return (
		<DataViews< Post >
			isLoading={ isResolving }
			data={ schemas }
			fields={ fields }
			view={ view }
			onChangeView={ ( view: View ) => {
				console.log( 'onChangeView', view );
				if ( view?.search?.length ) {
					setSearch( view.search );
					setOrderby( 'relevance' );
				} else {
					if ( view?.sort ) {
						setOrderby( view?.sort?.field );
						setOrder( view?.sort?.direction );
					}
				}
				setPerPage( view.perPage );
				setPage( view.page );
				setEnabled( view.filters?.[ 0 ]?.value );
				// // Pass the data to the view.
				setView( view );
			} }
			defaultLayouts={ defaultLayouts }
			// actions={ actions }
			// paginationInfo={ { totalItems, totalPages } }
			onChangeSelection={ ( things ) => {
				console.log( 'onChange', things );
			} }
		/>
	);
};

export default App;
